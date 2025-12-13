import { http, HttpResponse } from "msw";

const invoices = [
  {
    id: "inv-1",
    invoiceNumber: "INV-001",
    patientId: "p-1",
    patientName: "Nguyen Van A",
    invoiceDate: "2025-12-04T00:00:00Z",
    dueDate: "2025-12-10T00:00:00Z",
    appointmentId: "app-101",
    totalAmount: 500000,
    subtotal: 500000,
    discount: 0,
    tax: 0,
    paidAmount: 0,
    balance: 500000,
    status: "UNPAID",
    notes: "",
    createdAt: "2025-12-04T08:00:00Z",
    updatedAt: "2025-12-04T08:00:00Z",
    items: [
      {
        id: "item-1",
        invoiceId: "inv-1",
        type: "CONSULTATION",
        description: "Khám tổng quát",
        referenceId: "svc-1",
        quantity: 1,
        unitPrice: 300000,
        amount: 300000,
      },
      {
        id: "item-2",
        invoiceId: "inv-1",
        type: "MEDICINE",
        description: "Thuốc A",
        referenceId: "med-1",
        quantity: 2,
        unitPrice: 100000,
        amount: 200000,
      },
    ],
    payments: [],
  },
  {
    id: "inv-2",
    invoiceNumber: "INV-002",
    patientId: "p-2",
    patientName: "Tran Thi B",
    invoiceDate: "2025-12-03T00:00:00Z",
    dueDate: "2025-12-05T00:00:00Z",
    appointmentId: "app-102",
    totalAmount: 1000000,
    subtotal: 950000,
    discount: 0,
    tax: 100000,
    paidAmount: 300000,
    balance: 700000,
    status: "PARTIALLY_PAID",
    notes: "",
    createdAt: "2025-12-03T07:30:00Z",
    updatedAt: "2025-12-05T10:00:00Z",
    items: [
      {
        id: "item-2-1",
        invoiceId: "inv-2",
        type: "CONSULTATION",
        description: "Chuyên khoa nội",
        referenceId: "svc-2",
        quantity: 1,
        unitPrice: 500000,
        amount: 500000,
      },
      {
        id: "item-2-2",
        invoiceId: "inv-2",
        type: "TEST",
        description: "Xét nghiệm máu",
        referenceId: "test-1",
        quantity: 1,
        unitPrice: 250000,
        amount: 250000,
      },
      {
        id: "item-2-3",
        invoiceId: "inv-2",
        type: "MEDICINE",
        description: "Thuốc hỗ trợ",
        referenceId: "med-2",
        quantity: 2,
        unitPrice: 100000,
        amount: 200000,
      },
    ],
    payments: [
      {
        id: "pay-2-1",
        invoiceId: "inv-2",
        amount: 300000,
        method: "CASH",
        status: "COMPLETED",
        paymentDate: "2025-12-04T00:00:00Z",
        notes: "Deposit",
        createdAt: "2025-12-04T00:00:00Z",
        updatedAt: "2025-12-04T00:00:00Z",
      },
      {
        id: "pay-2-2",
        invoiceId: "inv-2",
        amount: 200000,
        method: "BANK_TRANSFER",
        status: "COMPLETED",
        paymentDate: "2025-12-05T00:00:00Z",
        notes: "Transfer second installment",
        createdAt: "2025-12-05T00:00:00Z",
        updatedAt: "2025-12-05T00:00:00Z",
      },
    ],
  },
  {
    id: "inv-3",
    invoiceNumber: "INV-003",
    patientId: "p-3",
    patientName: "Le Van C",
    invoiceDate: "2025-11-30T00:00:00Z",
    dueDate: "2025-12-02T00:00:00Z",
    appointmentId: "app-103",
    totalAmount: 700000,
    subtotal: 700000,
    discount: 50000,
    tax: 50000,
    paidAmount: 700000,
    balance: 0,
    status: "PAID",
    notes: "",
    createdAt: "2025-11-30T09:00:00Z",
    updatedAt: "2025-12-01T16:00:00Z",
    items: [
      {
        id: "item-3-1",
        invoiceId: "inv-3",
        type: "PROCEDURE",
        description: "Thủ thuật nội soi",
        referenceId: "proc-1",
        quantity: 1,
        unitPrice: 600000,
        amount: 600000,
      },
      {
        id: "item-3-2",
        invoiceId: "inv-3",
        type: "MEDICINE",
        description: "Thuốc phục hồi",
        referenceId: "med-3",
        quantity: 1,
        unitPrice: 100000,
        amount: 100000,
      },
    ],
    payments: [
      {
        id: "pay-3-1",
        invoiceId: "inv-3",
        amount: 750000,
        method: "CREDIT_CARD",
        status: "COMPLETED",
        paymentDate: "2025-12-01T00:00:00Z",
        notes: "Full payment",
        createdAt: "2025-12-01T00:00:00Z",
        updatedAt: "2025-12-01T00:00:00Z",
      },
    ],
  },
  {
    id: "inv-4",
    invoiceNumber: "INV-004",
    patientId: "p-4",
    patientName: "Pham D",
    invoiceDate: "2025-11-25T00:00:00Z",
    dueDate: "2025-11-27T00:00:00Z",
    appointmentId: "app-104",
    totalAmount: 1200000,
    subtotal: 1150000,
    discount: 0,
    tax: 50000,
    paidAmount: 200000,
    balance: 1000000,
    status: "OVERDUE",
    notes: "",
    createdAt: "2025-11-25T06:30:00Z",
    updatedAt: "2025-12-05T09:15:00Z",
    items: [
      {
        id: "item-4-1",
        invoiceId: "inv-4",
        type: "CONSULTATION",
        description: "Khám chuyên khoa tim mạch",
        referenceId: "svc-4",
        quantity: 1,
        unitPrice: 600000,
        amount: 600000,
      },
      {
        id: "item-4-2",
        invoiceId: "inv-4",
        type: "TEST",
        description: "Siêu âm tim",
        referenceId: "test-4",
        quantity: 1,
        unitPrice: 400000,
        amount: 400000,
      },
      {
        id: "item-4-3",
        invoiceId: "inv-4",
        type: "MEDICINE",
        description: "Thuốc tim",
        referenceId: "med-4",
        quantity: 1,
        unitPrice: 150000,
        amount: 150000,
      },
    ],
    payments: [
      {
        id: "pay-4-1",
        invoiceId: "inv-4",
        amount: 200000,
        method: "BANK_TRANSFER",
        status: "COMPLETED",
        paymentDate: "2025-11-26T00:00:00Z",
        notes: "Partial transfer",
        createdAt: "2025-11-26T00:00:00Z",
        updatedAt: "2025-11-26T00:00:00Z",
      },
      {
        id: "pay-4-2",
        invoiceId: "inv-4",
        amount: 150000,
        method: "INSURANCE",
        status: "PENDING",
        paymentDate: "2025-12-05T00:00:00Z",
        notes: "Insurance claim pending",
        createdAt: "2025-12-05T00:00:00Z",
        updatedAt: "2025-12-05T00:00:00Z",
      },
    ],
  },
  {
    id: "inv-5",
    invoiceNumber: "INV-005",
    patientId: "p-5",
    patientName: "Hoang E",
    invoiceDate: "2025-11-20T00:00:00Z",
    dueDate: "2025-11-22T00:00:00Z",
    appointmentId: "app-105",
    totalAmount: 300000,
    subtotal: 280000,
    discount: 0,
    tax: 20000,
    paidAmount: 0,
    balance: 300000,
    status: "CANCELLED",
    notes: "",
    createdAt: "2025-11-20T11:00:00Z",
    updatedAt: "2025-11-20T12:00:00Z",
    items: [
      {
        id: "item-5-1",
        invoiceId: "inv-5",
        type: "OTHER",
        description: "Phí thủ tục",
        referenceId: "svc-5",
        quantity: 1,
        unitPrice: 150000,
        amount: 150000,
      },
      {
        id: "item-5-2",
        invoiceId: "inv-5",
        type: "MEDICINE",
        description: "Thuốc kinh nghiệm",
        referenceId: "med-5",
        quantity: 2,
        unitPrice: 65000,
        amount: 130000,
      },
    ],
    payments: [],
  },
  {
    id: "inv-demo-cancel",
    invoiceNumber: "INV-DEM-001",
    patientId: "p-demo",
    patientName: "Demo Cancel",
    invoiceDate: new Date().toISOString(),
    dueDate: new Date(
      new Date().setDate(new Date().getDate() + 7)
    ).toISOString(),
    appointmentId: "app-demo-1",
    subtotal: 250000,
    discount: 0,
    tax: 0,
    totalAmount: 250000,
    paidAmount: 0,
    balance: 250000,
    status: "UNPAID",
    notes: "Demo invoice that stays unpaid so cancel is always visible",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: "item-demo-1",
        invoiceId: "inv-demo-cancel",
        type: "CONSULTATION",
        description: "Demo consultation",
        referenceId: "svc-demo",
        quantity: 1,
        unitPrice: 250000,
        amount: 250000,
      },
    ],
    payments: [],
  },
];

// Flatten payments with invoice context for list endpoints
const allPayments = () =>
  invoices.flatMap((inv) =>
    (inv.payments ?? []).map((p) => ({
      ...p,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      patientName: inv.patientName,
    }))
  );

export const billingHandlers = [
  http.get("**/api/billing/invoices", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search")?.toLowerCase();
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const sortParam = url.searchParams.get("sort") || "invoiceDate,desc";
    const pageParam = Number(url.searchParams.get("page") ?? 0);
    const sizeParam = Number(url.searchParams.get("size") ?? 10);

    let filtered = invoices;

    if (status && status !== "ALL") {
      filtered = filtered.filter((inv) => inv.status === status);
    }

    if (search) {
      filtered = filtered.filter(
        (inv) =>
          inv.patientName.toLowerCase().includes(search) ||
          inv.invoiceNumber.toLowerCase().includes(search)
      );
    }

    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter((inv) => new Date(inv.invoiceDate) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      filtered = filtered.filter((inv) => new Date(inv.invoiceDate) <= end);
    }

    const [sortKey, sortDir] = sortParam.split(",");
    filtered = [...filtered].sort((a, b) => {
      const direction = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "totalAmount":
          return (a.totalAmount - b.totalAmount) * direction;
        case "status":
          return a.status.localeCompare(b.status) * direction;
        case "invoiceDate":
        default:
          return (
            (new Date(a.invoiceDate).getTime() -
              new Date(b.invoiceDate).getTime()) *
            direction
          );
      }
    });

    const totalElements = filtered.length;
    const startIndex = pageParam * sizeParam;
    const content = filtered.slice(startIndex, startIndex + sizeParam);
    const totalPages = sizeParam > 0 ? Math.ceil(totalElements / sizeParam) : 1;

    return HttpResponse.json({
      content,
      page: pageParam,
      size: sizeParam,
      totalElements,
      totalPages,
      last: pageParam >= totalPages - 1,
    });
  }),

  http.get("**/api/billing/invoices/summary", () => {
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const unpaid = invoices.filter(
      (inv) => inv.status === "UNPAID" || inv.status === "PARTIALLY_PAID"
    );
    const unpaidCount = unpaid.length;
    const unpaidAmount = unpaid.reduce((sum, inv) => sum + inv.balance, 0);
    const overdue = invoices.filter((inv) => inv.status === "OVERDUE");
    const overdueCount = overdue.length;
    const overdueAmount = overdue.reduce((sum, inv) => sum + inv.balance, 0);

    // Collected this month (COMPLETED payments)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const collectedThisMonth = allPayments().reduce((sum, p) => {
      const date = new Date(p.paymentDate);
      if (date >= startOfMonth && p.status === "COMPLETED") {
        return sum + p.amount;
      }
      return sum;
    }, 0);

    return HttpResponse.json({
      totalInvoices,
      totalAmount,
      unpaidCount,
      unpaidAmount,
      overdueCount,
      overdueAmount,
      collectedThisMonth,
    });
  }),

  http.get("**/api/billing/invoices/:id", ({ params }) => {
    const invoice = invoices.find((i) => i.id === params.id);
    if (!invoice) {
      return HttpResponse.json(
        {
          status: "error",
          error: { code: "INVOICE_NOT_FOUND", message: "Invoice not found" },
        },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      status: "success",
      data: invoice,
    });
  }),

  http.get("**/api/billing/invoices/by-patient/:patientId", ({ params }) => {
    const filtered = invoices.filter((i) => i.patientId === params.patientId);
    return HttpResponse.json({
      data: filtered,
      total: filtered.length,
      page: 1,
      size: filtered.length,
    });
  }),

  http.get("**/api/billing/payments/by-invoice/:id", ({ params }) => {
    const invoice = invoices.find((i) => i.id === params.id);
    if (!invoice) {
      return HttpResponse.json(
        {
          status: "error",
          error: { code: "INVOICE_NOT_FOUND", message: "Invoice not found" },
        },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      payments: invoice.payments ?? [],
      totalPaid: invoice.paidAmount,
      invoiceTotal: invoice.totalAmount,
      remainingBalance: invoice.totalAmount - invoice.paidAmount,
    });
  }),

  http.get("**/api/billing/payments/summary-cards", () => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
      .toISOString()
      .split("T")[0];

    let todayAmount = 0;
    let todayCount = 0;
    let thisWeekAmount = 0;
    let thisWeekCount = 0;
    let cashAmount = 0;
    let cardAmount = 0;
    let totalPayments = 0;

    allPayments().forEach((p) => {
      const paymentDate = p.paymentDate.split("T")[0];
      if (p.status === "COMPLETED") {
        totalPayments++;
        if (paymentDate === today) {
          todayAmount += p.amount;
          todayCount++;
        }
        if (paymentDate >= startOfWeek) {
          thisWeekAmount += p.amount;
          thisWeekCount++;
        }
        if (p.method === "CASH") {
          cashAmount += p.amount;
        } else if (p.method === "CREDIT_CARD") {
          cardAmount += p.amount;
        }
      }
    });

    const cashPercentage =
      totalPayments > 0 ? (cashAmount / (cashAmount + cardAmount)) * 100 : 0;
    const cardPercentage =
      totalPayments > 0 ? (cardAmount / (cashAmount + cardAmount)) * 100 : 0;

    return HttpResponse.json({
      data: {
        todayAmount,
        todayCount,
        thisWeekAmount,
        thisWeekCount,
        cashAmount,
        cashPercentage: isNaN(cashPercentage) ? 0 : cashPercentage,
        cardAmount,
        cardPercentage: isNaN(cardPercentage) ? 0 : cardPercentage,
      },
    });
  }),

  http.get("**/api/billing/payments/:id", ({ params }) => {
    const payment = allPayments().find((p) => p.id === params.id);
    if (!payment) {
      return HttpResponse.json(
        {
          status: "error",
          error: { code: "PAYMENT_NOT_FOUND", message: "Payment not found" },
        },
        { status: 404 }
      );
    }
    return HttpResponse.json(payment);
  }),

  http.get("**/api/billing/payments", ({ request }) => {
    const url = new URL(request.url);
    const method = url.searchParams.get("method");
    const search = url.searchParams.get("search")?.toLowerCase();
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const sortParam = url.searchParams.get("sort") || "paymentDate,desc";
    const pageParam = Number(url.searchParams.get("page") ?? 0);
    const sizeParam = Number(url.searchParams.get("size") ?? 10);

    let payments = allPayments();

    if (method && method !== "ALL") {
      payments = payments.filter((p) => p.method === method);
    }
    if (search) {
      payments = payments.filter(
        (p) =>
          p.invoiceNumber.toLowerCase().includes(search) ||
          p.patientName.toLowerCase().includes(search)
      );
    }

    if (startDate) {
      const start = new Date(startDate);
      payments = payments.filter((p) => new Date(p.paymentDate) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      payments = payments.filter((p) => new Date(p.paymentDate) <= end);
    }

    const [sortKey, sortDir] = sortParam.split(",");
    const direction = sortDir === "asc" ? 1 : -1;
    payments = [...payments].sort((a, b) => {
      switch (sortKey) {
        case "amount":
          return (a.amount - b.amount) * direction;
        case "paymentDate":
        default:
          return (
            (new Date(a.paymentDate).getTime() -
              new Date(b.paymentDate).getTime()) *
            direction
          );
      }
    });

    const total = payments.length;
    const startIndex = pageParam * sizeParam;
    const content = payments.slice(startIndex, startIndex + sizeParam);

    return HttpResponse.json({
      data: content,
      total,
      page: pageParam,
      size: sizeParam,
    });
  }),

  http.post("**/api/billing/payments", async ({ request }) => {
    const body = (await request.json()) as any;
    if (!body?.invoiceId || typeof body.amount !== "number") {
      return HttpResponse.json(
        {
          status: "error",
          error: { code: "VALIDATION_ERROR", message: "Invalid payload" },
        },
        { status: 400 }
      );
    }
    const invoice = invoices.find((i) => i.id === body.invoiceId);
    if (!invoice) {
      return HttpResponse.json(
        {
          status: "error",
          error: { code: "INVOICE_NOT_FOUND", message: "Invoice not found" },
        },
        { status: 404 }
      );
    }

    const remaining = invoice.totalAmount - invoice.paidAmount;
    if (body.amount > remaining) {
      return HttpResponse.json(
        {
          status: "error",
          error: {
            code: "AMOUNT_EXCEEDS_BALANCE",
            message: "Amount exceeds remaining balance",
          },
        },
        { status: 400 }
      );
    }

    invoice.paidAmount += body.amount ?? 0;
    invoice.balance = invoice.totalAmount - (invoice.paidAmount ?? 0);
    invoice.status =
      (invoice.paidAmount ?? 0) >= invoice.totalAmount
        ? "PAID"
        : invoice.status === "UNPAID"
          ? "PARTIALLY_PAID"
          : invoice.status;

    const payment = {
      id: `pay-${Date.now()}`,
      invoiceId: invoice.id,
      amount: body.amount,
      method: body.method ?? "CASH",
      status: "COMPLETED",
      paymentDate: new Date().toISOString(),
      notes: body.notes ?? "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    invoice.payments = [...(invoice.payments ?? []), payment];

    return HttpResponse.json(payment, { status: 201 });
  }),

  http.post(
    "**/api/billing/invoices/:id/cancel",
    async ({ params, request }) => {
      const invoice = invoices.find((i) => i.id === params.id);
      if (!invoice) {
        return HttpResponse.json(
          {
            status: "error",
            error: { code: "INVOICE_NOT_FOUND", message: "Invoice not found" },
          },
          { status: 404 }
        );
      }
      if (invoice.status !== "UNPAID" || (invoice.payments ?? []).length > 0) {
        return HttpResponse.json(
          {
            status: "error",
            error: {
              code: "INVOICE_NOT_CANCELLABLE",
              message: "Only unpaid invoices without payments can be cancelled",
            },
          },
          { status: 400 }
        );
      }
      const body = (await request.json()) as any;
      invoice.status = "CANCELLED";
      invoice.notes = `Cancelled: ${body?.reason || ""}`;
      return HttpResponse.json(invoice);
    }
  ),
];
