import { useEffect, useMemo, useState } from 'react';
import FormError, { FieldError } from '../../components/FormError';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { EmptyState, ErrorState, LoadingText } from '../../components/States';
import { useAuth } from '../../context/AuthContext';
import * as invoicesApi from '../../api/invoices';
import * as reservationsApi from '../../api/reservations';
import { formatCurrencyExact, formatDateTime } from '../../utils/format';
import { hasErrors, positiveNumber, required, validate } from '../../validation';
import { AdminHeader, TableToolbar, useTableView } from './adminShared';

export default function AdminInvoices() {
  const { isAdmin } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apiMessage, setApiMessage] = useState('');
  const [apiErrors, setApiErrors] = useState(null);

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ reservationId: '', amount: '' });
  const [createErrors, setCreateErrors] = useState({});

  const [paying, setPaying] = useState(null);
  const [payForm, setPayForm] = useState({ paidAmount: '', paymentMethod: '' });
  const [payErrors, setPayErrors] = useState({});

  const [saving, setSaving] = useState(false);
  const [printable, setPrintable] = useState(null);

  const view = useTableView(invoices, ['customerName', 'status', 'paymentMethod'], 12);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [invRes, resRes] = await Promise.all([
        invoicesApi.getInvoices(),
        reservationsApi.getReservations().catch(() => ({ data: [] })),
      ]);
      setInvoices(invRes.data || []);
      setReservations(resRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => {
    const billed = invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
    const collected = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
    return { billed, collected, outstanding: billed - collected };
  }, [invoices]);

  const uninvoiced = useMemo(() => {
    const invoiced = new Set(invoices.map((inv) => inv.reservationId));
    return reservations.filter((r) => !invoiced.has(r.id) && r.status !== 'CANCELLED');
  }, [invoices, reservations]);

  const openCreate = () => {
    setCreateForm({ reservationId: '', amount: '' });
    setCreateErrors({});
    setApiMessage('');
    setApiErrors(null);
    setCreating(true);
  };

  const create = async (e) => {
    e.preventDefault();
    setApiMessage('');
    setApiErrors(null);

    const errors = validate({
      reservationId: [() => required(createForm.reservationId, 'Reservation is required')],
      amount: [
        () => required(createForm.amount, 'Amount is required'),
        () => positiveNumber(createForm.amount, 'Amount must be a positive number'),
      ],
    });
    setCreateErrors(errors);
    if (hasErrors(errors)) return;

    setSaving(true);
    try {
      await invoicesApi.createInvoice({
        reservationId: Number(createForm.reservationId),
        amount: Number(createForm.amount),
      });
      setSuccess('Invoice created.');
      setCreating(false);
      await load();
    } catch (err) {
      setApiMessage(err.message || 'Create failed');
      setApiErrors(err.errors || null);
      if (err.errors) setCreateErrors((prev) => ({ ...prev, ...err.errors }));
    } finally {
      setSaving(false);
    }
  };

  const openPay = (invoice) => {
    // The API stores paidAmount as the running total, so settling in full is the default.
    setPayForm({
      paidAmount: String(invoice.amount ?? ''),
      paymentMethod: invoice.paymentMethod || '',
    });
    setPayErrors({});
    setApiMessage('');
    setApiErrors(null);
    setPaying(invoice);
  };

  const recordPayment = async (e) => {
    e.preventDefault();
    setApiMessage('');
    setApiErrors(null);

    const errors = validate({
      paidAmount: [
        () => required(payForm.paidAmount, 'Paid amount is required'),
        () => (Number(payForm.paidAmount) < 0 ? 'Paid amount cannot be negative' : null),
      ],
    });
    setPayErrors(errors);
    if (hasErrors(errors)) return;

    setSaving(true);
    try {
      await invoicesApi.updatePayment(paying.id, {
        paidAmount: Number(payForm.paidAmount),
        paymentMethod: payForm.paymentMethod.trim() || null,
      });
      setSuccess('Payment recorded.');
      setPaying(null);
      await load();
    } catch (err) {
      setApiMessage(err.message || 'Payment update failed');
      setApiErrors(err.errors || null);
      if (err.errors) setPayErrors((prev) => ({ ...prev, ...err.errors }));
    } finally {
      setSaving(false);
    }
  };

  const openPrintable = async (invoice) => {
    setApiMessage('');
    try {
      const res = await invoicesApi.getPrintableInvoice(invoice.id);
      setPrintable(res.data || null);
    } catch (err) {
      setApiMessage(err.message || 'Could not load the printable invoice');
    }
  };

  const voidInvoice = async (invoice) => {
    if (!window.confirm(`Void invoice #${invoice.id}?`)) return;
    setApiMessage('');
    setSuccess('');
    try {
      await invoicesApi.voidInvoice(invoice.id);
      setSuccess('Invoice voided.');
      await load();
    } catch (err) {
      setApiMessage(err.message || 'Void failed');
    }
  };

  return (
    <div>
      <AdminHeader
        title="Invoices"
        description="Billing against reservations, payments received, and outstanding balances."
        action={
          <button type="button" className="btn btn--primary btn--sm" onClick={openCreate}>
            Create invoice
          </button>
        }
      />

      {success && <div className="success-banner">{success}</div>}
      <FormError message={apiMessage} errors={apiErrors} />

      {loading ? (
        <LoadingText>Loading invoices…</LoadingText>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat">
              <span className="stat__label">Total billed</span>
              <span className="stat__value">{formatCurrencyExact(totals.billed)}</span>
            </div>
            <div className="stat">
              <span className="stat__label">Collected</span>
              <span className="stat__value">{formatCurrencyExact(totals.collected)}</span>
            </div>
            <div className="stat">
              <span className="stat__label">Outstanding</span>
              <span className="stat__value">{formatCurrencyExact(totals.outstanding)}</span>
            </div>
          </div>

          <TableToolbar
            query={view.query}
            onQueryChange={view.setQuery}
            placeholder="Search by customer, status, or method"
          />

          {view.total === 0 ? (
            <EmptyState
              title="No invoices yet"
              message="Create an invoice against a reservation to start billing."
              actionLabel="Create invoice"
              onAction={openCreate}
            />
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Customer</th>
                      <th>Reservation</th>
                      <th>Issued</th>
                      <th>Amount</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {view.visible.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{invoice.id}</td>
                        <td>{invoice.customerName}</td>
                        <td>#{invoice.reservationId}</td>
                        <td>{formatDateTime(invoice.createdAt)}</td>
                        <td>{formatCurrencyExact(invoice.amount)}</td>
                        <td>{formatCurrencyExact(invoice.paidAmount)}</td>
                        <td>{formatCurrencyExact(invoice.balance)}</td>
                        <td>
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="table-actions">
                          <button
                            type="button"
                            className="btn btn--quiet btn--sm"
                            onClick={() => openPrintable(invoice)}
                          >
                            View
                          </button>
                          {invoice.status !== 'VOID' && invoice.status !== 'PAID' && (
                            <button
                              type="button"
                              className="btn btn--secondary btn--sm"
                              onClick={() => openPay(invoice)}
                            >
                              Payment
                            </button>
                          )}
                          {isAdmin && invoice.status !== 'VOID' && (
                            <button
                              type="button"
                              className="btn btn--danger btn--sm"
                              onClick={() => voidInvoice(invoice)}
                            >
                              Void
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={view.page}
                pageCount={view.pageCount}
                total={view.total}
                onChange={view.setPage}
              />
            </>
          )}
        </>
      )}

      {creating && (
        <Modal
          title="Create invoice"
          onClose={() => setCreating(false)}
          footer={
            <>
              <button type="button" className="btn btn--quiet" onClick={() => setCreating(false)}>
                Cancel
              </button>
              <button
                type="submit"
                form="invoice-form"
                className="btn btn--primary"
                disabled={saving}
              >
                {saving ? 'Creating…' : 'Create invoice'}
              </button>
            </>
          }
        >
          <form id="invoice-form" className="form-stack" onSubmit={create} noValidate>
            <FormError message={apiMessage} errors={apiErrors} />

            <label className="field">
              <span>Reservation</span>
              <select
                value={createForm.reservationId}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, reservationId: e.target.value }))
                }
              >
                <option value="">Select reservation</option>
                {uninvoiced.map((r) => (
                  <option key={r.id} value={r.id}>
                    #{r.id} — {r.customerName} · {r.hallName} · {r.eventDate}
                  </option>
                ))}
              </select>
              <FieldError error={createErrors.reservationId} />
              {uninvoiced.length === 0 && (
                <p className="muted" style={{ fontSize: 13 }}>
                  Every active reservation already has an invoice.
                </p>
              )}
            </label>

            <label className="field">
              <span>Amount</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={createForm.amount}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, amount: e.target.value }))}
              />
              <FieldError error={createErrors.amount} />
            </label>
          </form>
        </Modal>
      )}

      {paying && (
        <Modal
          title={`Record payment — invoice #${paying.id}`}
          onClose={() => setPaying(null)}
          footer={
            <>
              <button type="button" className="btn btn--quiet" onClick={() => setPaying(null)}>
                Cancel
              </button>
              <button
                type="submit"
                form="payment-form"
                className="btn btn--primary"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save payment'}
              </button>
            </>
          }
        >
          <form id="payment-form" className="form-stack" onSubmit={recordPayment} noValidate>
            <FormError message={apiMessage} errors={apiErrors} />

            <div className="summary__row">
              <span>Invoiced</span>
              <strong>{formatCurrencyExact(paying.amount)}</strong>
            </div>
            <div className="summary__row">
              <span>Outstanding balance</span>
              <strong>{formatCurrencyExact(paying.balance)}</strong>
            </div>

            <label className="field">
              <span>Total paid to date</span>
              <input
                type="number"
                min="0"
                max={paying.amount}
                step="0.01"
                value={payForm.paidAmount}
                onChange={(e) => setPayForm((prev) => ({ ...prev, paidAmount: e.target.value }))}
              />
              <FieldError error={payErrors.paidAmount} />
              <p className="muted" style={{ fontSize: 13 }}>
                Enter the cumulative amount received, not just this instalment. It cannot exceed
                the invoice total.
              </p>
            </label>

            <label className="field">
              <span>Payment method</span>
              <input
                value={payForm.paymentMethod}
                onChange={(e) => setPayForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                placeholder="Card / Cash / Transfer"
              />
              <FieldError error={payErrors.paymentMethod} />
            </label>
          </form>
        </Modal>
      )}

      {printable && (
        <Modal title={printable.invoiceNumber || 'Invoice'} onClose={() => setPrintable(null)}>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--navy)',
            }}
          >
            {printable.printText || JSON.stringify(printable, null, 2)}
          </pre>
        </Modal>
      )}
    </div>
  );
}
