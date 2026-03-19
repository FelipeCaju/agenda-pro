export function assertTenantScope(organizationId) {
  if (!organizationId) {
    throw new Error("organizationId e obrigatorio para queries multiempresa");
  }

  return organizationId;
}

export function withTenantFilter(organizationId, filters = {}) {
  return {
    organization_id: assertTenantScope(organizationId),
    ...filters,
  };
}

