import assert from "node:assert/strict";
import test from "node:test";
import { normalizeNotificationPage, normalizeNotificationSummary } from "../src/services/notification-response.ts";
const page = {results:[{id:1,title:"Hồ sơ chờ duyệt"}],has_next:true};
test("unwraps the real notification view plus renderer envelope", () => {
  assert.deepEqual(normalizeNotificationPage({success:true,data:{message:"Thông báo",data:page}}),page);
  assert.deepEqual(normalizeNotificationSummary({success:true,data:{data:{pending_profiles:2,unread_count:3}}}),{pending_profiles:2,pending_complaints:0,unread_count:3});
});
test("supports already unwrapped and single wrapped responses", () => {
  assert.deepEqual(normalizeNotificationPage(page),page);
  assert.deepEqual(normalizeNotificationPage({data:page}),page);
});
test("empty notification pages remain valid", () => {
  assert.deepEqual(normalizeNotificationPage({data:{data:{results:[],has_next:false}}}),{results:[],has_next:false});
});
test("malformed responses become query errors rather than undefined results", () => {
  for(const value of [null,undefined,{data:null},{data:{data:{}}},{results:{}}]) assert.throws(()=>normalizeNotificationPage(value));
  assert.throws(()=>normalizeNotificationSummary({data:{unread_count:2}}));
});
