import assert from "node:assert/strict";
import test from "node:test";
import { apiError } from "../src/lib/api-error.ts";

test("preserves nested Django validation errors with field labels, without metadata", () => {
  const result = apiError({status:400,data:{success:false,status_code:400,message:"Dữ liệu không hợp lệ.",errors:{address_id:["Địa chỉ không thuộc khách hàng."],service_data:{date:["Ngày phải ở tương lai."]}},timestamp:"ignored",error_code:"VALIDATION_ERROR"}});
  assert.equal(result,"Dữ liệu không hợp lệ.\nĐịa chỉ thực hiện: Địa chỉ không thuộc khách hàng.\nThông tin dịch vụ / Ngày làm việc: Ngày phải ở tương lai.");
});
test("reads nested envelopes and Axios response errors", () => {
  assert.equal(apiError({response:{data:{data:{errors:{voucher_code:["Mã đã hết hạn."]}}}}}),"Mã giảm giá: Mã đã hết hạn.");
  assert.equal(apiError({data:{detail:"Không đủ quyền."}}),"Không đủ quyền.");
});
test("handles null errors and serialized exceptions", () => {
  assert.equal(apiError({data:{message:"Không thể phân công buổi đã kết thúc.",errors:null}}),"Không thể phân công buổi đã kết thúc.");
  assert.equal(apiError({name:"Error",message:"Ngày kết thúc không hợp lệ."}),"Ngày kết thúc không hợp lệ.");
});
test("does not render HTML responses or stringify objects", () => {
  assert.match(apiError({status:502,data:"<!doctype html><html>proxy error</html>"}),/HTTP 502/);
  assert.doesNotMatch(apiError({data:{errors:{service_data:{date:["Sai ngày."]}}}}),/object Object/);
});
test("explains connection and timeout failures", () => {
  assert.match(apiError({data:"Network Error"}),/Không kết nối được máy chủ/);
  assert.match(apiError({data:"timeout of 30000ms exceeded"}),/quá thời gian chờ/);
});
