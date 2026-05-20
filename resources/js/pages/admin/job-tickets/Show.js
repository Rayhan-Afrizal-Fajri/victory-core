"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Show;
var react_2 = require("@inertiajs/react");
var react_1 = require("react");
var app_layout_1 = require("@/layouts/app-layout");
var job_tickets_1 = require("@/routes/job-tickets");
var StatusBadge_1 = require("./components/StatusBadge");
var WorkflowTabs_1 = require("./components/WorkflowTabs");
var dummyJobTicket = {
    id: 1,
    order_number: 'JT-2026-0001',
    customer: { name: 'PT. Contoh' },
    product_name: 'Kemeja Kerja',
    deadline: '2026-06-01',
    status: 'Produksi',
    workflow_status: {
        design_approved: true,
        sample_approved: false,
        production_dp_paid: false,
        materials_distributed: false,
        production_completed: false,
        qc_completed: false,
        packing_completed: false,
        final_payment_paid: false,
        delivered: false,
    },
    designs: [{ id: 1, file_path: 'design_v1.pdf', note: 'Initial', approved: true, created_at: '2026-05-10' }],
    samples: [{ id: 1, qty: 2, status: 'pending' }],
    invoices: [
        { id: 1, title: 'Invoice Sampel', amount: 500000, status: 'Unpaid', issued_at: '2026-05-12' },
        { id: 2, title: 'Invoice Produksi', amount: 2000000, status: 'Unpaid', issued_at: '2026-05-20' },
    ],
    payments: [],
    purchasings: [
        { id: 1, item: 'Kain Katun', supplier: 'PT. Supplier', ordered_qty: 100, received_qty: 20 },
    ],
    productionProgress: { percent: 20, phase: 'Cutting', checklist: ['Potong', 'Sew'] },
    qc: { reject_count: 0 },
    packing: {},
    delivery: {},
    activity_logs: [{ id: 1, actor: 'Andi', role: 'CS', action: 'Buat job', note: 'Order masuk', created_at: '2026-05-10' }],
};
function Show(_a) {
    var pesanan = _a.pesanan;
    var jobTicket = pesanan !== null && pesanan !== void 0 ? pesanan : dummyJobTicket;

    return (<>
        <react_2.Head title={"Job Ticket \u2014 ".concat(jobTicket.order_number)}/>

        <WorkflowTabs_1.default job={jobTicket}/>

    </>);
}
// Perbarui fungsi Show.layout di bagian paling bawah file Show.tsx Anda menjadi seperti ini:
Show.layout = function (page) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    var pesanan = (_a = page.props) === null || _a === void 0 ? void 0 : _a.pesanan;
    var noJobTicket = (pesanan === null || pesanan === void 0 ? void 0 : pesanan.order_number) || 'Detail Tiket';
    var progress = (_d = (_c = (_b = pesanan === null || pesanan === void 0 ? void 0 : pesanan.productionProgress) === null || _b === void 0 ? void 0 : _b.percent) !== null && _c !== void 0 ? _c : pesanan === null || pesanan === void 0 ? void 0 : pesanan.progressPercent) !== null && _d !== void 0 ? _d : 0;
    var priority = (_g = (_f = (_e = pesanan === null || pesanan === void 0 ? void 0 : pesanan.productionProgress) === null || _e === void 0 ? void 0 : _e.prioritas) !== null && _f !== void 0 ? _f : pesanan === null || pesanan === void 0 ? void 0 : pesanan.priority) !== null && _g !== void 0 ? _g : 'Normal';

    return (<app_layout_1.default title={noJobTicket} description={"".concat((_j = (_h = pesanan === null || pesanan === void 0 ? void 0 : pesanan.customer) === null || _h === void 0 ? void 0 : _h.name) !== null && _j !== void 0 ? _j : 'Customer', " \u00B7 ").concat((_k = pesanan === null || pesanan === void 0 ? void 0 : pesanan.product_name) !== null && _k !== void 0 ? _k : 'Produk')} information="No. Job Ticket" breadcrumbs={[
            {
                title: 'Job Tickets',
                href: job_tickets_1.default.index(),
            },
            {
                title: noJobTicket,
                href: pesanan
                    ? job_tickets_1.default.show(pesanan.id)
                    : '#',
            },
        ]} actions={<div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Deadline</div>
                        <div className="font-medium">{(_l = pesanan === null || pesanan === void 0 ? void 0 : pesanan.deadline) !== null && _l !== void 0 ? _l : '—'}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Progress</div>
                        <div className="w-40 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div className="h-3 bg-green-500" style={{ width: "".concat(progress, "%") }}/>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{progress}%</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Prioritas</div>
                        <StatusBadge_1.default label={priority !== null && priority !== void 0 ? priority : 'Normal'} variant={priority === 'High' || priority === 'Urgent' ? 'warning' : 'default'}/>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Status</div>
                        <StatusBadge_1.default label={(_m = pesanan === null || pesanan === void 0 ? void 0 : pesanan.status) !== null && _m !== void 0 ? _m : 'Aktif'} variant={(pesanan === null || pesanan === void 0 ? void 0 : pesanan.status) === 'Done' ? 'success' : 'info'}/>
                    </div>
                </div>}>
            {page}
        </app_layout_1.default>);
};
