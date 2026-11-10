import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, unlinkSync, rmdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { configureStore } from "@reduxjs/toolkit";
import ts from "typescript";

// Exercise the real endpoint and Redux cache; only replace the HTTP transport.
const folder = mkdtempSync(join(dirname(fileURLToPath(import.meta.url)), ".service-toggle-"));
const basePath = join(folder, "base.mjs");
const apiPath = join(folder, "api.mjs");
writeFileSync(basePath, `
import { createApi } from "@reduxjs/toolkit/query/react";
export const backend = { active: true, fail: false, reads: 0 };
const service = () => ({ id: 12, name: "Dọn nhà", code: "HOME_CLEANING", section_code: "HOME_CLEANING", description: "Test", is_active: backend.active, images: [], form_schema: {}, pricing_config: {}, primary_image: null });
export const baseApi = createApi({ reducerPath: "api", tagTypes: ["Services"], endpoints: () => ({}), baseQuery: async ({ url, method, data, params }) => {
 if (method === "PATCH") {
   if (backend.fail) return { error: { status: 500, data: { message: "Upload unavailable" } } };
   backend.active = data.is_active;
   return { data: { message: "OK", data: service() } };
 }
 backend.reads++;
 return { data: { message: "OK", data: url.endsWith("/12/") ? service() : (params?.is_active === undefined || params.is_active === backend.active ? [service()] : []) } };
} });
`);
const source = readFileSync(new URL("../src/services/servicesApi.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
writeFileSync(apiPath, compiled.replace('"@/store/baseApi"', '"./base.mjs"'));
const { servicesApi: api } = await import(pathToFileURL(apiPath).href);
const { backend } = await import(pathToFileURL(basePath).href);
after(() => { unlinkSync(apiPath); unlinkSync(basePath); rmdirSync(folder); });

function newStore() {
  backend.active = true;
  backend.fail = false;
  backend.reads = 0;
  return configureStore({ reducer: { api: api.reducer }, middleware: getDefault => getDefault().concat(api.middleware) });
}

test("list and detail are updated before mutation unwrap resolves, without another list request", async () => {
  const store = newStore();
  try {
    await store.dispatch(api.endpoints.getServices.initiate()).unwrap();
    await store.dispatch(api.endpoints.getServiceDetail.initiate(12)).unwrap();
    const reads = backend.reads;
    await store.dispatch(api.endpoints.toggleServiceActive.initiate({ id: 12, is_active: false })).unwrap();
    assert.equal(api.endpoints.getServices.select()(store.getState()).data.data[0].is_active, false);
    assert.equal(api.endpoints.getServiceDetail.select(12)(store.getState()).data.data.is_active, false);
    assert.equal(backend.reads, reads);
    await store.dispatch(api.endpoints.toggleServiceActive.initiate({ id: 12, is_active: true })).unwrap();
    assert.equal(api.endpoints.getServices.select()(store.getState()).data.data[0].is_active, true);
  } finally { store.dispatch(api.util.resetApiState()); }
});

test("status-filtered caches move the service to the matching list on success", async () => {
  const store = newStore();
  try {
    const active = { is_active: true };
    const inactive = { is_active: false };
    await store.dispatch(api.endpoints.getServices.initiate(active)).unwrap();
    await store.dispatch(api.endpoints.getServices.initiate(inactive)).unwrap();
    await store.dispatch(api.endpoints.toggleServiceActive.initiate({ id: 12, is_active: false })).unwrap();
    assert.equal(api.endpoints.getServices.select(active)(store.getState()).data.data.length, 0);
    assert.equal(api.endpoints.getServices.select(inactive)(store.getState()).data.data[0].is_active, false);
  } finally { store.dispatch(api.util.resetApiState()); }
});

test("failed toggle keeps the confirmed status and rejects unwrap", async () => {
  const store = newStore();
  try {
    await store.dispatch(api.endpoints.getServices.initiate()).unwrap();
    backend.fail = true;
    await assert.rejects(store.dispatch(api.endpoints.toggleServiceActive.initiate({ id: 12, is_active: false })).unwrap());
    assert.equal(api.endpoints.getServices.select()(store.getState()).data.data[0].is_active, true);
  } finally { store.dispatch(api.util.resetApiState()); }
});
