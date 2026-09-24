import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FdForm from './FdForm.jsx';
import KycForm from './KycForm.jsx';
import { mergeDraft } from './defaults.js';
import { downloadPdf } from './pdf.js';
import { withShared } from './shared.js';
import { clearCustomerDraft, loadDraft, loadOffice, newCustomerDraft, saveDraft } from './storage.js';
import { FormModeContext } from './ui.jsx';
import { missingFields } from './validate.js';

export default function App() {
  const [draft, setDraft] = useState(() => withShared(mergeDraft(loadDraft(), loadOffice())));
  const [page, setPage] = useState('hub');
  const [savedFlash, setSavedFlash] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [blockMsg, setBlockMsg] = useState(null);
  const pending = useRef(null);
  const returnPage = useRef('hub');

  const persist = useCallback((next) => {
    const stored = saveDraft(withShared(next));
    setDraft(stored);
    setSavedFlash(true);
  }, []);

  useEffect(() => {
    if (!savedFlash) return;
    const t = setTimeout(() => setSavedFlash(false), 1600);
    return () => clearTimeout(t);
  }, [savedFlash]);

  const setKyc = (kyc) => persist({ ...draft, kyc });
  const setFd = (fd) => persist({ ...draft, fd });
  const setOffice = (office) => persist({ ...draft, office });

  const missing = useMemo(() => missingFields(draft), [draft]);

  const savedLabel = useMemo(() => {
    if (!draft.savedAt) return 'Not saved yet';
    try {
      return `Draft saved ${new Date(draft.savedAt).toLocaleString()}`;
    } catch {
      return 'Draft saved';
    }
  }, [draft.savedAt]);

  const formMode = page === 'review' || page === 'print' ? 'print' : 'edit';

  useEffect(() => {
    if (page !== 'print' || !pending.current) return undefined;
    const action = pending.current;
    const t = setTimeout(async () => {
      try {
        if (action === 'print') window.print();
        if (action === 'pdf') {
          await downloadPdf(`shriram-forms-${draft.kyc.name || 'draft'}.pdf`);
        }
      } finally {
        pending.current = null;
        setPdfBusy(false);
        setPage(returnPage.current);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [page, draft.kyc.name]);

  function requestOutput(action) {
    if (missing.length) {
      setBlockMsg({ action, items: missing });
      return;
    }
    startOutput(action);
  }

  function startOutput(action) {
    setBlockMsg(null);
    returnPage.current = page === 'print' ? 'review' : page;
    if (action === 'pdf') setPdfBusy(true);
    pending.current = action;
    setPage('print');
  }

  const showSheets = page === 'kyc' || page === 'fd' || page === 'review' || page === 'print';
  const showKyc = page === 'kyc' || page === 'review' || page === 'print';
  const showFd = page === 'fd' || page === 'review' || page === 'print';

  return (
    <FormModeContext.Provider value={formMode}>
      <div className={`app mode-${formMode}`}>
        <header className="toolbar no-print">
          <div>
            <strong>Shriram Finance</strong>
            <span className="sub">Fill on computer · print · pen signature</span>
          </div>
          <nav>
            <button type="button" className={page === 'hub' ? 'on' : ''} onClick={() => setPage('hub')}>
              Home
            </button>
            <button type="button" className={page === 'kyc' ? 'on' : ''} onClick={() => setPage('kyc')}>
              1. KYC
            </button>
            <button type="button" className={page === 'fd' ? 'on' : ''} onClick={() => setPage('fd')}>
              2. FD
            </button>
            <button type="button" className={page === 'review' ? 'on' : ''} onClick={() => setPage('review')}>
              3. Review
            </button>
          </nav>
          <div className="actions">
            <span className={`save-pill ${savedFlash ? 'flash' : ''}`}>{savedFlash ? 'Saved on this computer' : savedLabel}</span>
            {missing.length ? <span className="miss-count">{missing.length} required empty</span> : <span className="ok-count">Ready to print</span>}
            <button type="button" onClick={() => requestOutput('print')}>
              Print both (A4)
            </button>
            <button type="button" disabled={pdfBusy} onClick={() => requestOutput('pdf')}>
              {pdfBusy ? 'Preparing PDF…' : 'Download PDF'}
            </button>
          </div>
        </header>

        {blockMsg ? (
          <div className="modal no-print" role="dialog" aria-labelledby="block-title">
            <div className="modal-card">
              <h2 id="block-title">Fill required fields before print</h2>
              <p>These items are empty. Fix them, then print both pages in one job and take the paper to the customer for a pen signature.</p>
              <ul>
                {blockMsg.items.map((m) => (
                  <li key={m.label}>
                    <button
                      type="button"
                      className="linkish"
                      onClick={() => {
                        setBlockMsg(null);
                        setPage(m.page === 'hub' ? 'hub' : m.page);
                      }}
                    >
                      {m.label}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="hub-actions">
                <button type="button" onClick={() => setBlockMsg(null)}>
                  Go back and fill
                </button>
                <button type="button" className="danger" onClick={() => startOutput(blockMsg.action)}>
                  Print / PDF anyway
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {page === 'hub' ? (
          <main className="hub no-print">
            <h1>Fill on the computer, print, then get a pen signature</h1>
            <ol className="steps">
              <li>Set office details once (reused for every customer).</li>
              <li>Fill KYC + FATCA-CRS. Identity fields copy onto the FD sheet.</li>
              <li>Fill the Fixed Deposit application (payment, bank, nomination).</li>
              <li>Review. Print both pages on A4 (or download a PDF backup).</li>
              <li>Take the printouts to the customer. They sign on paper with a pen.</li>
            </ol>

            <h2>This office (reused)</h2>
            <div className="office-grid">
              <label>
                Business Associate Code
                <input className="caps" value={draft.office.baCode} onChange={(e) => setOffice({ ...draft.office, baCode: e.target.value.toUpperCase() })} />
              </label>
              <label>
                Affiliate Business Associate
                <input
                  className="caps"
                  value={draft.office.affiliateBa}
                  onChange={(e) => setOffice({ ...draft.office, affiliateBa: e.target.value.toUpperCase() })}
                />
              </label>
              <label>
                Branch *
                <input className="caps" value={draft.office.branch} onChange={(e) => setOffice({ ...draft.office, branch: e.target.value.toUpperCase() })} />
              </label>
              <label>
                Place (for KYC declaration)
                <input className="caps" value={draft.office.place} onChange={(e) => setOffice({ ...draft.office, place: e.target.value.toUpperCase() })} />
              </label>
            </div>

            <div className="cards">
              <button type="button" className="card" onClick={() => setPage('kyc')}>
                <h2>1. Fill KYC + FATCA-CRS</h2>
                <p>Customer identity, address, income, tax residency. Typed in capital letters.</p>
              </button>
              <button type="button" className="card" onClick={() => setPage('fd')}>
                <h2>2. Fill FD application</h2>
                <p>First applicant is copied from KYC. Add deposit, bank, and nomination details.</p>
              </button>
              <button type="button" className="card" onClick={() => setPage('review')}>
                <h2>3. Review and print</h2>
                <p>
                  {missing.length
                    ? `${missing.length} required field(s) still empty.`
                    : 'Required fields look complete. Print both A4 pages.'}
                </p>
              </button>
            </div>
            <div className="hub-actions">
              <button type="button" onClick={() => requestOutput('print')}>
                Print both pages (A4)
              </button>
              <button type="button" onClick={() => requestOutput('pdf')} disabled={pdfBusy}>
                Download PDF backup
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  if (confirm('Start a new customer? Office details are kept. This customer’s draft is cleared on this computer.')) {
                    setDraft(newCustomerDraft(draft.office));
                    setPage('kyc');
                  }
                }}
              >
                New customer
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear this customer draft? Office details stay saved.')) {
                    clearCustomerDraft();
                    setDraft(withShared(mergeDraft(null, draft.office)));
                  }
                }}
              >
                Clear customer draft
              </button>
            </div>
          </main>
        ) : null}

        {page === 'review' ? (
          <div className="review-banner no-print">
            {missing.length ? (
              <p>
                <strong>{missing.length} required field(s) empty.</strong> Print is blocked until they are filled (or you confirm Print anyway).
                Signature boxes stay blank for a pen on paper.
              </p>
            ) : (
              <p>
                <strong>Ready.</strong> Print both pages on A4, take them to the customer, and get wet signatures in the boxes.
              </p>
            )}
            {missing.length ? (
              <ul className="missing-list">
                {missing.map((m) => (
                  <li key={m.label}>
                    <button type="button" className="linkish" onClick={() => setPage(m.page === 'hub' ? 'hub' : m.page)}>
                      {m.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <main className={`pages ${showSheets ? '' : 'hidden-pages'}`}>
          {showKyc ? <KycForm kyc={draft.kyc} setKyc={setKyc} /> : null}
          {showFd ? <FdForm fd={draft.fd} office={draft.office} setFd={setFd} setOffice={setOffice} /> : null}
        </main>
      </div>
    </FormModeContext.Provider>
  );
}
