"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateAdminBookingMutation, useSearchCustomersQuery } from "@/services/bookingApi";
import { useGetServiceDetailQuery, useGetServicesQuery } from "@/services/servicesApi";
import type { FormField, ServiceFormSchema } from "@/types/Service";
import { apiError, Field, selectClass } from "./booking-ui";

function DynamicField({ field, value, onChange }: { field: FormField; value: unknown; onChange: (value: unknown) => void }) {
  const options = Array.isArray(field.options) && !field.options.some((item) => "when" in item) ? field.options as { label: string; value: string }[] : [];
  if (["MULTI_SELECT", "WEEKDAY_MULTI_SELECT"].includes(field.type)) return <div className="grid gap-2 sm:grid-cols-2">{options.map((option) => { const values = Array.isArray(value) ? value : []; return <label key={option.value} className="flex items-center gap-2 rounded-md border p-2 text-sm font-normal"><input type="checkbox" checked={values.includes(option.value)} onChange={(e) => onChange(e.target.checked ? [...values, option.value] : values.filter((v) => v !== option.value))} />{option.label}</label>; })}</div>;
  if (field.type === "BOOLEAN") return <label className="flex h-10 items-center gap-2"><input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} /> Có</label>;
  if (field.type === "TEXTAREA") return <Textarea value={String(value ?? "")} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} required={field.required} />;
  if (field.type === "SINGLE_SELECT" && options.length) return <select className={selectClass} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} required={field.required}><option value="">Chọn...</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
  if (["REPEATABLE_GROUP", "TASK_CHECKLIST"].includes(field.type) || field.options_by) return <Textarea value={typeof value === "string" ? value : JSON.stringify(value ?? [], null, 2)} onChange={(e) => { try { onChange(JSON.parse(e.target.value)); } catch { onChange(e.target.value); } }} placeholder="Nhập dữ liệu JSON cho trường nâng cao" />;
  const type = field.type === "DATE" ? "date" : field.type === "TIME" ? "time" : field.type === "QUANTITY" ? "number" : "text";
  return <Input type={type} value={String(value ?? "")} min={field.min} max={field.max} placeholder={field.placeholder} required={field.required} onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)} />;
}

export function CreateBookingDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerId, setCustomerId] = useState<number>();
  const [serviceId, setServiceId] = useState<number>();
  const [addressId, setAddressId] = useState<number>();
  const [deliveryAddressId, setDeliveryAddressId] = useState<number>();
  const [serviceData, setServiceData] = useState<Record<string, unknown>>({});
  const [note, setNote] = useState("");
  const [voucher, setVoucher] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER">("CASH");
  const { data: customers, isFetching: searching } = useSearchCustomersQuery(customerSearch, { skip: !open });
  const { data: services } = useGetServicesQuery({ is_active: true });
  const { data: serviceDetail } = useGetServiceDetailQuery(serviceId ?? 0, { skip: !serviceId });
  const [createBooking, { isLoading }] = useCreateAdminBookingMutation();
  const selectedCustomer = customers?.results.find((item) => item.id === customerId);
  const fields = useMemo(() => ((serviceDetail?.data?.form_schema as ServiceFormSchema | undefined)?.fields ?? []), [serviceDetail]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!customerId || !serviceId || !addressId) return toast.error("Vui lòng chọn khách hàng, dịch vụ và địa chỉ.");
    try {
      const booking = await createBooking({ customer_id: customerId, service_id: serviceId, address_id: addressId, delivery_address_id: deliveryAddressId || null, service_data: serviceData, note, voucher_code: voucher, payment_method: paymentMethod }).unwrap();
      toast.success("Đã tạo đơn dịch vụ."); setOpen(false); router.push(`/bookings/${booking.id}`);
    } catch (error) { toast.error(apiError(error), { duration: 10000 }); }
  };

  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="h-4 w-4" />Tạo đơn mới</Button></DialogTrigger><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Tạo đơn thay khách hàng</DialogTitle><DialogDescription>Chọn khách hàng, địa chỉ và nhập thông tin theo biểu mẫu của dịch vụ.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-5">
    <Field label="Tìm khách hàng" required><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Tên, số điện thoại hoặc email" /></div></Field>
    {searching ? <p className="text-sm text-slate-500">Đang tìm...</p> : <div className="grid max-h-40 gap-2 overflow-y-auto">{customers?.results.map((customer) => <button type="button" key={customer.id} onClick={() => { setCustomerId(customer.id); setAddressId(customer.addresses.find((a) => a.is_default)?.id ?? customer.addresses[0]?.id); }} className={`rounded-lg border p-3 text-left text-sm ${customerId === customer.id ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}><b>{customer.full_name}</b><span className="ml-2 text-slate-500">{customer.phone_number || customer.email}</span></button>)}</div>}
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Dịch vụ" required><select className={selectClass} value={serviceId ?? ""} onChange={(e) => { setServiceId(Number(e.target.value) || undefined); setServiceData({}); }}><option value="">Chọn dịch vụ</option>{services?.data.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></Field><Field label="Phương thức thanh toán" required><select className={selectClass} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}><option value="CASH">Tiền mặt</option><option value="BANK_TRANSFER">Chuyển khoản</option></select></Field></div>
    {selectedCustomer && <div className="grid gap-4 sm:grid-cols-2"><Field label="Địa chỉ thực hiện" required><select className={selectClass} value={addressId ?? ""} onChange={(e) => setAddressId(Number(e.target.value) || undefined)}><option value="">Chọn địa chỉ</option>{selectedCustomer.addresses.map((a) => <option key={a.id} value={a.id}>{a.label} — {a.address_line}</option>)}</select></Field><Field label="Địa chỉ giao nhận"><select className={selectClass} value={deliveryAddressId ?? ""} onChange={(e) => setDeliveryAddressId(Number(e.target.value) || undefined)}><option value="">Không có</option>{selectedCustomer.addresses.map((a) => <option key={a.id} value={a.id}>{a.label} — {a.address_line}</option>)}</select></Field></div>}
    {fields.length > 0 && <div className="rounded-lg border border-slate-200 p-4"><h4 className="mb-4 font-semibold text-slate-900">Thông tin dịch vụ</h4><div className="grid gap-4 sm:grid-cols-2">{fields.map((field) => <Field key={field.key} label={field.label} required={field.required}><DynamicField field={field} value={serviceData[field.key]} onChange={(value) => setServiceData((current) => ({ ...current, [field.key]: value }))} /></Field>)}</div></div>}
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Mã giảm giá"><Input value={voucher} onChange={(e) => setVoucher(e.target.value)} /></Field><Field label="Ghi chú"><Textarea className="min-h-10" value={note} onChange={(e) => setNote(e.target.value)} /></Field></div>
    <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Đóng</Button><Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}Tạo đơn</Button></DialogFooter>
  </form></DialogContent></Dialog>;
}

