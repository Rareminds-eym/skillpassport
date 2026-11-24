/**
 * Legacy plan shape still referenced by the unused BulkPurchaseWizard (scheduled for removal, Task 44).
 * Hybrid is now a published catalog offer: its copy comes from the published configuration and sales
 * routing is server-side (owner decision d). Never identify Hybrid by plan code or name.
 */
export interface HybridCatalogPlan {
  id: string;
  plan_code?: string;
  name: string;
  display_name?: string;
  contactSales?: boolean;
  description?: string;
}
