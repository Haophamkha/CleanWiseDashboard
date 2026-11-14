"use client";
import { SelectField } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { toast } from "sonner";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { apiError } from "@/features/bookings/booking-ui";
import { useGetMonthlyVipQuery, useRewardMonthlyVipMutation } from "@/services/reportApi";
import { useGetVouchersQuery } from "@/services/voucherApi";
import type { VipCustomer } from "@/types/Report";
import { currency } from "./report-utils";

export default function MonthlyVip({ month }: { month: string }) {
  const [minimum, setMinimum] = useState(5);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<VipCustomer[]>([]);
  const [voucherId, setVoucherId] = useState("");
  const [review, setReview] = useState(false);
  const params = { year: Number(month.slice(0,4)), month: Number(month.slice(5)), min_bookings: minimum, page, page_size: 5 };
  const query = useGetMonthlyVipQuery(params, { refetchOnMountOrArgChange: true });
  const vouchers = useGetVouchersQuery({ distribution_type: "ASSIGNED", is_active: true });
  const [reward, { isLoading: sending }] = useRewardMonthlyVipMutation();
  const eligibleVouchers = (vouchers.currentData?.data ?? []).filter(v=>v.lifecycle_status==="ACTIVE");
  const voucher = eligibleVouchers.find(v=>v.id===Number(voucherId));
  const rows = query.currentData?.results ?? [];
  const available = rows.filter(c=>!c.rewarded);
  const chosen = selected.filter(c=>!rows.some(row=>row.customer_id===c.customer_id && row.rewarded));
  const enough = !voucher || voucher.remaining_issuance === null || voucher.remaining_issuance >= chosen.length;
  const toggle = (customer: VipCustomer) => setSelected(previous=>previous.some(c=>c.customer_id===customer.customer_id)?previous.filter(c=>c.customer_id!==customer.customer_id):[...previous,customer]);
  async function confirm() {
    if (!voucher || !chosen.length) return;
    try {
      const result = await reward({ ...params, customer_ids: chosen.map(c=>c.customer_id), voucher_id: voucher.id }).unwrap();
      toast.success(`Đã tặng ${result.assigned_count} voucher${result.skipped_count ? `; bỏ qua ${result.skipped_count} khách đã nhận` : ""}.`);
      setSelected([]); setReview(false);
    } catch (error) { toast.error(apiError(error)); void query.refetch(); }
  }
  return <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[["Khách đạt tiêu chí VIP",query.currentData?.summary.customers],["Chưa nhận voucher",query.currentData?.summary.unrewarded],["Đã nhận trong tháng",query.currentData?.summary.rewarded],["Đang chọn",chosen.length]].map(([label,value])=><Card key={label}><CardContent className="p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold">{value??"—"}</p></CardContent></Card>)}</div>
    <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_260px]">
      <Card className="[&_tbody_td]:py-3 [&_tbody_td]:text-xs"><CardHeader className="gap-3 p-4"><CardTitle>Khách hàng VIP theo tháng</CardTitle><div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><div className="flex items-center gap-2">Tối thiểu <SelectField label="Số đơn tối thiểu" className="w-28" value={String(minimum)} onValueChange={(value) => { setMinimum(Number(value)); setPage(1); setSelected([]); }} options={[3, 5, 8, 10, 15].map((count) => ({ value: String(count), label: count + " đơn" }))} />/ tháng</div><span>Đơn tạo trong tháng · Hoàn thành, đã trả tiền, chưa hoàn tiền</span></div></CardHeader>
        {query.isError ? <div role="alert" className="p-6 text-sm text-rose-600">{apiError(query.error)} <Button variant="outline" onClick={()=>query.refetch()}>Thử lại</Button></div> : !query.currentData ? <Skeleton className="m-4 h-60"/> : <div aria-busy={query.isFetching}><Table><TableHeader><TableRow><TableHead className="w-10 pl-4"><Checkbox aria-label="Chọn khách chưa nhận trên trang" disabled={!available.length||query.isFetching||sending} checked={available.length>0&&available.every(row=>chosen.some(c=>c.customer_id===row.customer_id))} onCheckedChange={checked=>setSelected(previous=>checked === true?[...previous.filter(c=>!available.some(r=>r.customer_id===c.customer_id)),...available]:previous.filter(c=>!available.some(r=>r.customer_id===c.customer_id)))}/></TableHead><TableHead>Khách hàng</TableHead><TableHead className="text-right">Số đơn ↓</TableHead><TableHead className="hidden text-right lg:table-cell">Giá trị đơn</TableHead><TableHead>Tri ân</TableHead></TableRow></TableHeader><TableBody>{rows.length ? rows.map(customer=><TableRow key={customer.customer_id} className={chosen.some(c=>c.customer_id===customer.customer_id)?"bg-blue-50":""}><TableCell className="pl-4"><Checkbox aria-label={`Chọn ${customer.name}`} disabled={customer.rewarded||query.isFetching||sending} checked={chosen.some(c=>c.customer_id===customer.customer_id)} onCheckedChange={()=>toggle(customer)}/></TableCell><TableCell><p className="font-medium text-slate-800">{customer.name}</p><p className="mt-1 text-xs text-slate-400">@{customer.username}</p></TableCell><TableCell className="text-right tabular-nums">{customer.booking_count}</TableCell><TableCell className="hidden text-right tabular-nums lg:table-cell">{currency(customer.completed_value)}</TableCell><TableCell><span className={`rounded px-2 py-1 text-xs ${customer.rewarded?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{customer.rewarded?"Đã tặng":"Chưa tặng"}</span>{customer.reward_code&&<p className="mt-1 text-xs text-slate-400">{customer.reward_code}</p>}</TableCell></TableRow>):<TableRow><TableCell colSpan={5} className="py-10 text-center text-slate-400">Chưa có khách đạt tiêu chí trong tháng này.</TableCell></TableRow>}</TableBody></Table><div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 p-3 text-xs text-slate-500"><span>{query.currentData.count} khách · Trang {query.currentData.page}/{query.currentData.total_pages} · Đã chọn {chosen.length}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={!query.currentData.has_previous||query.isFetching||sending} onClick={()=>setPage(page-1)}>Trước</Button><Button size="sm" variant="outline" disabled={!query.currentData.has_next||query.isFetching||sending} onClick={()=>setPage(page+1)}>Tiếp</Button></div></div></div>}
      </Card>
      <Card><CardContent className="space-y-4 p-4"><Gift className="h-6 w-6 text-blue-600"/><h2 className="font-semibold text-slate-900">Tri ân khách hàng</h2><div className="space-y-2 text-xs text-slate-500"><span>Voucher tặng riêng</span><SelectField label="Voucher tặng riêng" value={voucherId} onValueChange={setVoucherId} disabled={vouchers.isFetching || sending} placeholder="Chọn voucher" options={eligibleVouchers.map((voucher) => ({ value: String(voucher.id), label: voucher.name + " · " + voucher.code }))} /></div>
        {vouchers.isError&&<p role="alert" className="text-xs text-rose-600">Không tải được voucher. <button className="underline" onClick={()=>vouchers.refetch()}>Thử lại</button></p>}
        {!vouchers.isFetching&&!vouchers.isError&&!eligibleVouchers.length&&<p className="text-xs text-slate-500">Chưa có voucher cấp riêng đang hoạt động. <LinkToVouchers/></p>}
        {voucher&&<div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-4"><p className="text-2xl font-semibold text-blue-700">{voucher.discount_type==="FIXED"?currency(voucher.discount_value):`${voucher.discount_value}%`}</p><p className="mt-2 text-xs text-slate-500">Đơn từ {currency(voucher.min_order_amount)}{voucher.max_discount_amount?` · Giảm tối đa ${currency(voucher.max_discount_amount)}`:""}</p><p className="mt-1 text-xs text-slate-500">Hết hạn {new Date(voucher.end_at).toLocaleDateString("vi-VN")}</p><p className="mt-1 text-xs text-slate-500">Còn {voucher.remaining_issuance===null?"không giới hạn":voucher.remaining_issuance} lượt cấp</p></div>}
        <p className="text-xs text-slate-500">{chosen.length} người nhận · 1 voucher/khách/tháng. Khách đã nhận tri ân trong tháng được loại trừ.</p>{!enough&&<p role="alert" className="text-xs text-rose-600">Voucher không còn đủ lượt cấp cho số khách đã chọn.</p>}
        <Button className="w-full" disabled={!voucher||!chosen.length||chosen.length>50||!enough||sending||query.isFetching||query.isError} onClick={()=>setReview(true)}>Xem lại & tặng</Button>
        {chosen.length>0&&<Button className="w-full" variant="ghost" disabled={sending} onClick={()=>setSelected([])}>Bỏ chọn tất cả</Button>}
      </CardContent></Card>
    </div>
    <Dialog open={review} onOpenChange={open=>{if(!sending)setReview(open);}}><DialogContent className="max-w-lg" onEscapeKeyDown={event=>{if(sending)event.preventDefault();}} onInteractOutside={event=>{if(sending)event.preventDefault();}}><DialogHeader><DialogTitle>Xem lại ưu đãi tri ân</DialogTitle><DialogDescription>Tháng {month.slice(5)}/{month.slice(0,4)} · {chosen.length} khách nhận voucher {voucher?.code}</DialogDescription></DialogHeader><p className="text-sm text-slate-600">{chosen.map(c=>c.name).join(", ")}</p><p className="text-sm">Mỗi khách nhận {voucher?.discount_type==="FIXED"?currency(voucher.discount_value):`${voucher?.discount_value}%`}. Backend kiểm tra lại điều kiện và giới hạn cấp trước khi thực hiện.</p><DialogFooter><Button variant="outline" disabled={sending} onClick={()=>setReview(false)}>Quay lại</Button><Button disabled={sending} onClick={confirm}>{sending?"Đang tặng…":"Xác nhận tặng voucher"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
function LinkToVouchers(){return <a href="/vouchers" className="text-blue-600 underline">Mở mục Voucher</a>;}
