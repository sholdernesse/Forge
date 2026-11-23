# Release-owner review — November 22, 2026

Shane Holdernesse responded "I approve" to the request to approve Forge's final
terms, fitness waiver, privacy text, and operating entity. This records owner
approval of the material presented for review; it is not a user acceptance
receipt, counsel opinion, or evidence that an LLC has been formed.

The current repository materials reviewed at this point are identified by SHA-256:

| Material | SHA-256 |
| --- | --- |
| `apps/api/src/consent.ts` | `9f0f17f8c7075b414b9bc8ace52d51d751906ef2f38ebfcc832787bce7784eab` |
| `apps/web/src/PublicDocumentPage.tsx` | `437ad0cce8327073c0cb775a1cee7b6a003d2e7f3147f2b71806a5395775842f` |

The canonical policy is still `approved: false`, with versions marked
`2026-10-26-draft-3`. Its health-data document explicitly says the final notice
must confirm the verified contact, recipients, withdrawal process, and retention
before approval. The public privacy notice says backups remain for a limited
period without stating the configured seven-day period; actual provider handling
and the monitored support mailbox have not been verified in a deployed candidate.
The current name omits the intended LLC suffix because formation and the exact
filed name have not been verified.

**Activation gate:** reconcile those facts in the exact published documents,
assign new version identifiers, obtain review of the resulting material changes,
and only then set the canonical approval flag. Validate the final deployed
candidate and obtain qualified counsel review before general availability or
multi-jurisdiction launch. No external invitation or signed acceptance should
be possible from this record alone.

## Follow-up candidate

Candidate `2026-11-22-candidate-1` incorporates the repository's configured
Azure retention periods, the existing withdrawal/deletion behavior, and
OpenAI's published default abuse-monitoring retention. Its substantive
health-data consent and public privacy disclosures differ from the source
identified above; the earlier owner approval does not silently extend to these
changes. The canonical policy stays unapproved while the actual support mailbox,
deployed provider settings, consent-receipt retention, and legal operating name
are verified. The separate draft file remains historical working material.
