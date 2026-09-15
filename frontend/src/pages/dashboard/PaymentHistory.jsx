import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FormError from '../../components/FormError';
import StatusBadge from '../../components/StatusBadge';
import { EmptyState, ErrorState, LoadingText } from '../../components/States';
import * as invoicesApi from '../../api/invoices';
import { formatCurrencyExact, formatDateTime } from '../../utils/format';

export default function PaymentHistory() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await invoicesApi.getInvoices();
      setInvoices(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load your payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => {
    const billed = invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
    const paid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
    return { billed, paid, outstanding: billed - paid };
  }, [invoices]);

  const download = async (invoice) => {
    setMessage('');
    setBusyId(invoice.id);
    try {
      const res = await invoicesApi.getPrintableInvoice(invoice.id);
      const data = res.data || {};
      const text = data.printText || JSON.stringify(data, null, 2);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.invoiceNumber || `vorynza-invoice-${invoice.id}`}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage(err.message || 'Could not download the invoice');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div className="page-head__text">
          <p className="eyebrow">Dashboard</p>
          <h1>Payment history</h1>
          <p className="lead">Invoices issued against your reservations.</p>
        </div>
      </div>

      {message && <FormError message={message} />}

      {loading ? (
        <LoadingText>Loading invoices…</LoadingText>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          message="Once the hotel issues an invoice for your reservation it will show up here."
          actionLabel="View my bookings"
          actionTo="/dashboard/bookings"
        />
      ) : (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat">
              <span className="stat__label">Total billed</span>
              <span className="stat__value">{formatCurrencyExact(totals.billed)}</span>
            </div>
            <div className="stat">
              <span className="stat__label">Total paid</span>
              <span className="stat__value">{formatCurrencyExact(totals.paid)}</span>
            </div>
            <div className="stat">
              <span className="stat__label">Outstanding</span>
              <span className="stat__value">{formatCurrencyExact(totals.outstanding)}</span>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
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
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>#{invoice.id}</td>
                    <td>
                      <Link to="/dashboard/bookings" className="link-gold">
                        #{invoice.reservationId}
                      </Link>
                    </td>
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
                        onClick={() => download(invoice)}
                        disabled={busyId === invoice.id}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
