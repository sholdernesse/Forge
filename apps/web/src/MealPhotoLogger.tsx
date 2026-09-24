import { useRef, useState } from 'react';
import { Camera, Check, ImagePlus, LoaderCircle, Sparkles, Trash2, X } from 'lucide-react';
import type { FoodEntry, MealType } from './foodLog.js';
import { createFoodEntry } from './foodLog.js';
import { FoodDataClient, FoodDataError, type MealPhotoAnalysis, type MealPhotoItem } from './foodDataClient.js';
import { useAccessibleDialog } from './useAccessibleDialog.js';

interface DraftItem extends MealPhotoItem { selected: boolean; }
interface Props { date: string; meal: MealType; client: FoodDataClient; onAdd(entries: FoodEntry[]): void; onClose(): void; }

export function constrainedPhotoDimensions(width: number, height: number, maximum = 1280) {
  if (width <= 0 || height <= 0) throw new Error('Invalid image dimensions');
  const scale = Math.min(1, maximum / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Photo could not be read'));
    reader.onerror = () => reject(new Error('Photo could not be read'));
    reader.readAsDataURL(blob);
  });
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Photo could not be prepared')), 'image/jpeg', quality));
}

export async function prepareMealPhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Use a JPEG, PNG, or WebP photo.');
  if (file.size > 12_000_000) throw new Error('Photo is too large. Choose an image under 12 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    const dimensions = constrainedPhotoDimensions(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Photo processing is unavailable in this browser.');
    context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);
    for (const quality of [0.82, 0.68, 0.54]) {
      const blob = await canvasBlob(canvas, quality);
      if (blob.size <= 700_000) return blobToDataUrl(blob);
    }
    throw new Error('Photo remains too large. Move closer to the plate and try again.');
  } finally {
    bitmap.close();
  }
}

export function entriesFromMealPhoto(items: DraftItem[], date: string, meal: MealType, now = Date.now()): FoodEntry[] {
  return items.filter((item) => item.selected).map((item, index) => createFoodEntry(date, meal, {
    name: item.name.trim() || 'Meal item',
    serving: `${Math.max(1, Math.round(item.estimatedGrams))} g estimated from photo`,
    caloriesKcal: Math.max(0, Math.round(item.caloriesKcal)),
    proteinG: Math.max(0, Math.round(item.proteinG * 10) / 10),
    carbsG: Math.max(0, Math.round(item.carbsG * 10) / 10),
    fatG: Math.max(0, Math.round(item.fatG * 10) / 10),
    ...(item.referenceFoodId ? { sourceFoodId: item.referenceFoodId } : {}),
  }, `${date}-${meal}-photo-${now}-${index}`));
}

export function mealPhotoErrorMessage(error: unknown) {
  if (error instanceof FoodDataError && error.reason === 'provider_authentication_failed') return 'OpenAI rejected the API key. Check OPENAI_API_KEY in .env.local, then restart Forge.';
  if (error instanceof FoodDataError && error.reason === 'provider_access_denied') return 'This API project cannot use the configured vision model. Check the project permissions or choose an enabled model.';
  if (error instanceof FoodDataError && error.reason === 'provider_model_unavailable') return 'OPENAI_VISION_MODEL is unavailable to this API project. Try gpt-6-luna, then restart Forge.';
  if (error instanceof FoodDataError && error.reason === 'provider_quota_or_rate_limit') return 'The OpenAI API project has no available quota or is rate limited. Add API billing or wait, then try again.';
  if (error instanceof FoodDataError && error.reason === 'provider_request_rejected') return 'OpenAI rejected the photo-analysis request. Check the API terminal for the failure category.';
  if (error instanceof FoodDataError && error.reason === 'provider_timeout') return 'OpenAI did not finish the analysis within 30 seconds. Try the photo again.';
  if (error instanceof FoodDataError && error.reason === 'provider_unreachable') return 'Forge could not reach OpenAI. Check the computer network or firewall and try again.';
  if (error instanceof FoodDataError && error.reason === 'provider_invalid_response') return 'OpenAI returned an unusable meal estimate. Try a clearer photo.';
  if (error instanceof FoodDataError && error.status === 503) return 'Photo analysis is configured, but the provider is temporarily unavailable.';
  if (error instanceof FoodDataError && error.status === 413) return 'The prepared photo is too large. Try a closer photo.';
  if (error instanceof FoodDataError && error.status === 429) return 'You have reached the hourly photo-analysis limit. Review an earlier meal or try again later.';
  if (error instanceof FoodDataError && error.status === 401) return 'Sign in again before analyzing a meal photo.';
  return error instanceof Error ? error.message : 'Forge could not analyze this photo.';
}

export function MealPhotoLogger({ date, meal, client, onAdd, onClose }: Props) {
  const dialogRef = useAccessibleDialog(onClose);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>();
  const [analysis, setAnalysis] = useState<MealPhotoAnalysis>();
  const [items, setItems] = useState<DraftItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'preparing' | 'analyzing'>('idle');
  const [message, setMessage] = useState('Take a clear overhead or angled photo with the full plate visible.');
  const selected = items.filter((item) => item.selected);
  const totals = selected.reduce((sum, item) => ({ calories: sum.calories + item.caloriesKcal, protein: sum.protein + item.proteinG, carbs: sum.carbs + item.carbsG, fat: sum.fat + item.fatG }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  async function analyze(file?: File) {
    if (!file) return;
    setAnalysis(undefined); setItems([]); setStatus('preparing'); setMessage('Preparing a private, metadata-free copy…');
    try {
      const imageDataUrl = await prepareMealPhoto(file);
      setPreview(imageDataUrl); setStatus('analyzing'); setMessage('Identifying foods and estimating visible portions…');
      const result = await client.analyzeMealPhoto(imageDataUrl);
      setAnalysis(result); setItems(result.items.map((item) => ({ ...item, selected: true }))); setMessage('Review every item, portion, and macro before adding this meal.');
    } catch (error) {
      setMessage(mealPhotoErrorMessage(error));
    } finally { setStatus('idle'); }
  }

  function update(index: number, field: keyof DraftItem, value: string | boolean) {
    setItems((current) => current.map((item, itemIndex) => itemIndex !== index ? item : { ...item, [field]: typeof item[field] === 'number' ? Math.max(0, Number(value)) : value }));
  }

  function addMeal() {
    const entries = entriesFromMealPhoto(items, date, meal);
    if (!entries.length) return;
    onAdd(entries); onClose();
  }

  return <div className="barcode-scanner-backdrop" onMouseDown={onClose}><section ref={dialogRef} className="meal-photo-logger" role="dialog" aria-modal="true" aria-labelledby="meal-photo-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
    <header><div><span className="section-label">ASSISTED MEAL ESTIMATE</span><h3 id="meal-photo-title">Analyze a meal photo</h3></div><button onClick={onClose} aria-label="Close meal photo analysis"><X size={18} /></button></header>
    <input ref={inputRef} className="meal-photo-input" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => void analyze(event.target.files?.[0])} />
    {!preview ? <button className="meal-photo-capture" onClick={() => inputRef.current?.click()}><Camera size={24} /><span><b>Take or choose a photo</b><small>The image is resized, metadata is removed, and the photo itself is not saved to your Forge history.</small></span></button> : <div className="meal-photo-preview"><img src={preview} alt="Meal selected for nutrition analysis" /><button onClick={() => inputRef.current?.click()}><ImagePlus size={16} /> Replace photo</button></div>}
    <p className={`meal-photo-message ${status !== 'idle' ? 'working' : ''}`}>{status !== 'idle' && <LoaderCircle size={16} />} {message}</p>
    {items.length > 0 && <>
      <section className="meal-photo-items">{items.map((item, index) => <article className={item.selected ? '' : 'excluded'} key={`${item.name}-${index}`}>
        <label className="meal-photo-select"><input type="checkbox" checked={item.selected} onChange={(event) => update(index, 'selected', event.target.checked)} /><span><Check size={13} /></span></label>
        <div className="meal-photo-fields"><input aria-label={`Food ${index + 1} name`} value={item.name} onChange={(event) => update(index, 'name', event.target.value)} /><small>{item.portionDescription} · {Math.round(item.confidence * 100)}% visual confidence · {item.nutritionSource === 'usda' ? `USDA match${item.referenceFoodName ? `: ${item.referenceFoodName}` : ''}` : 'AI estimate—verify carefully'}</small><div>
          <label>Grams<input type="number" min="1" value={item.estimatedGrams} onChange={(event) => update(index, 'estimatedGrams', event.target.value)} /></label>
          <label>Calories<input type="number" min="0" value={item.caloriesKcal} onChange={(event) => update(index, 'caloriesKcal', event.target.value)} /></label>
          <label>Protein<input type="number" min="0" step="0.1" value={item.proteinG} onChange={(event) => update(index, 'proteinG', event.target.value)} /></label>
          <label>Carbs<input type="number" min="0" step="0.1" value={item.carbsG} onChange={(event) => update(index, 'carbsG', event.target.value)} /></label>
          <label>Fat<input type="number" min="0" step="0.1" value={item.fatG} onChange={(event) => update(index, 'fatG', event.target.value)} /></label>
        </div></div>
        <button className="meal-photo-remove" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${item.name}`}><Trash2 size={15} /></button>
      </article>)}</section>
      {(analysis?.assumptions.length || analysis?.warnings.length) ? <details className="meal-photo-notes"><summary>Assumptions and uncertainty</summary><ul>{[...(analysis?.assumptions ?? []), ...(analysis?.warnings ?? [])].map((note) => <li key={note}>{note}</li>)}</ul></details> : null}
      <footer className="meal-photo-review"><div><span>{selected.length} items selected</span><b>{Math.round(totals.calories)} kcal · P {Math.round(totals.protein)} · C {Math.round(totals.carbs)} · F {Math.round(totals.fat)}</b><small>Photo estimates can miss oils, sauces, ingredients, and exact weights.</small></div><button disabled={!selected.length} onClick={addMeal}><Sparkles size={16} /> Add reviewed meal</button></footer>
    </>}
  </section></div>;
}
