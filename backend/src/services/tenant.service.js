import { listTenants as listTenantsFromStore } from "../lib/data.js";

export async function getTenants() {
  return listTenantsFromStore();
}
