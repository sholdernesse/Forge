# Sprint 4.5 — Explainable AI Coach Experience

## Goal

Make the AI Coach entry point functional while preserving Forge's service-owned, explainable decision boundary.

## Delivered

- responsive Coach drawer available from the dashboard card, desktop navigation, and mobile navigation
- questions about training, nutrition, and recovery routed to category-relevant recommendations
- each answer exposes the recommendation, rationale, and confidence that grounded it
- suggested prompts and a free-text question flow
- safe fallback when the Digital Twin lacks enough evidence
- fitness-only safety language without medical diagnosis claims

## Architecture

This slice intentionally uses the deterministic `CoachService` instead of an external language model. It creates a functional, testable experience without adding inference cost or allowing generated prose to bypass Forge's recommendation rules. A later model-backed adapter can phrase grounded answers while retaining recommendation IDs as citations.

## Acceptance

- Coach opens and closes on desktop and mobile
- training, nutrition, and recovery questions do not cite unrelated recommendations
- answers remain useful when a category has no active adjustment
- lint, type checking, tests, production build, infrastructure compilation, and container builds pass in CI
