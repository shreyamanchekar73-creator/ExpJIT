import { Box, CapsArea, CapsInput, DateInput, EmailInput, Field, Hint, PenBox, Radio, Row } from './ui.jsx';

function PersonBlock({ title, note, person, onChange, extra, fromKyc }) {
  const set = (patch) => onChange({ ...person, ...patch });
  return (
    <section className="block">
      <h3>
        {title} <span className="note">{note}</span>
      </h3>
      {fromKyc ? <p className="hint">Name, DOB, PAN, CKYC, customer ID, email and mobile are copied from the KYC sheet.</p> : null}
      <Row>
        <Field label="Mr / Ms / Minor">
          <CapsInput value={person.title} onChange={(v) => set({ title: v })} placeholder="MR / MS / MINOR" readOnly={fromKyc} />
        </Field>
        <Field label="Name" className="grow" star>
          <CapsInput value={person.name} onChange={(v) => set({ name: v })} readOnly={fromKyc} />
        </Field>
        <Field label="CKYC No (if any)">
          <CapsInput value={person.ckyc} onChange={(v) => set({ ckyc: v })} readOnly={fromKyc} />
        </Field>
      </Row>
      <Row>
        <Field label="DOB" star>
          <DateInput value={person.dob} onChange={(e) => set({ dob: e.target.value })} readOnly={fromKyc} />
        </Field>
        <Field label="PAN" star>
          <CapsInput value={person.pan} onChange={(v) => set({ pan: v })} readOnly={fromKyc} />
        </Field>
        <Field label="Form 97">
          <Box label="Form 97" checked={person.form97} onChange={(form97) => set({ form97 })} />
        </Field>
        <Field label="Customer ID (if existing investor)">
          <CapsInput value={person.customerId} onChange={(v) => set({ customerId: v })} readOnly={fromKyc} />
        </Field>
      </Row>
      <Row>
        <Field label="Email ID">
          <EmailInput value={person.email} onChange={(e) => set({ email: e.target.value.toUpperCase() })} readOnly={fromKyc} />
        </Field>
        <Field label="Mobile No">
          <CapsInput value={person.mobile} onChange={(v) => set({ mobile: v })} inputMode="tel" readOnly={fromKyc} />
        </Field>
        {extra}
      </Row>
    </section>
  );
}

export default function FdForm({ fd, office, setFd, setOffice }) {
  const set = (patch) => setFd({ ...fd, ...patch });
  const setOff = (patch) => setOffice({ ...office, ...patch });

  return (
    <article className="sheet fd-sheet">
      <header className="sheet-head">
        <div className="brand">
          <div>
            <h1>Shriram Finance Limited</h1>
            <p className="offices">
              Regd. Office: Sri Towers, Plot No. 14A, South Phase, Industrial Estate, Guindy, Chennai – 600 032. Ph: 044 485 24 666
              www.shriramfinance.in · Admin Office: 6th Floor (level 2), Building No. Q2, Aurum Q Parc, Gen A.K. Vaidya Marg, Thane Belapur
              Road, Ghansoli, Navi Mumbai 400710. Ph: +91 22 4095 7575
            </p>
          </div>
          <div className="meta-grid">
            <Field label="Business Associate Code">
              <CapsInput value={office.baCode} onChange={(v) => setOff({ baCode: v })} />
            </Field>
            <Field label="Affiliate Business Associate">
              <CapsInput value={office.affiliateBa} onChange={(v) => setOff({ affiliateBa: v })} />
            </Field>
            <Field label="Branch" star>
              <CapsInput value={office.branch} onChange={(v) => setOff({ branch: v })} />
            </Field>
          </div>
        </div>
        <h2>Application Form for Fixed Deposit (Resident Individual)</h2>
        <p className="banner">Please fill the information in CAPITAL letters and tick in appropriate places, only with black or blue ink</p>
      </header>

      <Row>
        <p className="lead">
          I/We wish to apply for Fresh/Renewal of Deposit for a period of
          <CapsInput className="inline" value={fd.periodMonths} onChange={(v) => set({ periodMonths: v })} />
          months.
        </p>
      </Row>

      <h3>Payment Details</h3>
      <Row>
        <Field label="If Fresh, Cheque/RTGS/NEFT, UTR No">
          <CapsInput value={fd.freshUtr} onChange={(v) => set({ freshUtr: v })} />
        </Field>
        <Field label="Amount">
          <CapsInput value={fd.amount} onChange={(v) => set({ amount: v })} />
        </Field>
        <Field label="Drawn on">
          <CapsInput value={fd.drawnOn} onChange={(v) => set({ drawnOn: v })} />
        </Field>
        <Field label="Date">
          <DateInput value={fd.chequeDate} onChange={(e) => set({ chequeDate: e.target.value })} />
        </Field>
      </Row>
      <Row>
        <Field label="If Renewal, Old Cert No">
          <CapsInput value={fd.oldCertNo} onChange={(v) => set({ oldCertNo: v })} />
        </Field>
        <Field label="Maturity Date">
          <DateInput value={fd.maturityDate} onChange={(e) => set({ maturityDate: e.target.value })} />
        </Field>
        <Field label="Renewal Amount Rs.">
          <CapsInput value={fd.renewalAmount} onChange={(v) => set({ renewalAmount: v })} />
        </Field>
      </Row>
      <Row>
        <Field label="Part Refund Amount Rs.">
          <CapsInput value={fd.partRefund} onChange={(v) => set({ partRefund: v })} />
        </Field>
        <Field label="Total Investment Amount Rs.">
          <CapsInput value={fd.totalInvestment} onChange={(v) => set({ totalInvestment: v })} />
        </Field>
        <Field label="Deposit Type">
          <div className="boxes">
            {['Fresh', 'Renewal', 'Both'].map((t) => (
              <Radio key={t} name="depType" value={t} current={fd.depositType} onChange={(v) => set({ depositType: v })} label={t} />
            ))}
          </div>
        </Field>
      </Row>

      <div className="four-col">
        <section>
          <h3>Type of Receipt</h3>
          {['Physical Receipt', 'E-Receipt'].map((t) => (
            <Radio key={t} name="receipt" value={t} current={fd.receiptType} onChange={(v) => set({ receiptType: v })} label={t} />
          ))}
        </section>
        <section>
          <h3>Maturity Instruction</h3>
          {[
            'Auto Refund',
            'Renew only Principal Amount',
            'Renew Principal with Interest Amount (if not opted will be treated as auto refund)',
          ].map((t) => (
            <Radio key={t} name="mat" value={t} current={fd.maturityInstruction} onChange={(v) => set({ maturityInstruction: v })} label={t} />
          ))}
        </section>
        <section>
          <h3>Mode of Operation</h3>
          {['Sole/First Applicant', 'Anyone or Survivor/s', 'Former or Survivor/s'].map((t) => (
            <Radio key={t} name="mode" value={t} current={fd.modeOfOperation} onChange={(v) => set({ modeOfOperation: v })} label={t} />
          ))}
        </section>
        <section>
          <h3>Scheme</h3>
          {['Cumulative', 'Monthly Interest', 'Quarterly Interest', 'Half-Yearly Interest', 'Yearly Interest'].map((t) => (
            <Radio key={t} name="scheme" value={t} current={fd.scheme} onChange={(v) => set({ scheme: v })} label={t} />
          ))}
        </section>
      </div>
      <Row>
        <Field label="Senior Citizen">
          <div className="boxes">
            <Radio name="sc" value="Yes" current={fd.seniorCitizen} onChange={(v) => set({ seniorCitizen: v })} label="Yes" />
            <Radio name="sc" value="No" current={fd.seniorCitizen} onChange={(v) => set({ seniorCitizen: v })} label="No" />
          </div>
        </Field>
        <Field label="Minor">
          <div className="boxes">
            <Radio name="minor" value="Yes" current={fd.minor} onChange={(v) => set({ minor: v })} label="Yes" />
            <Radio name="minor" value="No" current={fd.minor} onChange={(v) => set({ minor: v })} label="No" />
          </div>
        </Field>
      </Row>

      <PersonBlock
        title="First Applicant Details as per KYC Document"
        note="(For new / Non-CKYC investor, KYC form mandatory)"
        person={fd.first}
        fromKyc
        onChange={(first) => set({ first })}
        extra={
          <Field label="Form 12F furnished">
            <div className="boxes">
              <Radio name="f12" value="Yes" current={fd.first.form12f} onChange={(v) => set({ first: { ...fd.first, form12f: v } })} label="Yes" />
              <Radio name="f12" value="No" current={fd.first.form12f} onChange={(v) => set({ first: { ...fd.first, form12f: v } })} label="No" />
            </div>
          </Field>
        }
      />
      <Hint>If No, TDS will be deducted. *If investment amount is less than or equal to ₹50,000/- or aggregating to less than ₹5,00,000/- during financial year.</Hint>

      <PersonBlock
        title="Second Applicant Details as per KYC Document"
        note="(For new / Non-CKYC investor, KYC form mandatory)"
        person={fd.second}
        onChange={(second) => set({ second })}
      />

      <section className="block">
        <h3>
          Natural Guardian Details as per KYC Document <span className="note">(For new / Non-CKYC investor, KYC form mandatory)</span>
        </h3>
        <Row>
          <Field label="Mr / Ms">
            <CapsInput value={fd.guardian.title} onChange={(v) => set({ guardian: { ...fd.guardian, title: v } })} />
          </Field>
          <Field label="Name" className="grow">
            <CapsInput value={fd.guardian.name} onChange={(v) => set({ guardian: { ...fd.guardian, name: v } })} />
          </Field>
          <Field label="CKYC No (if any)">
            <CapsInput value={fd.guardian.ckyc} onChange={(v) => set({ guardian: { ...fd.guardian, ckyc: v } })} />
          </Field>
        </Row>
        <Field label="Guardian of">
          <div className="boxes">
            <Radio
              name="gof"
              value="First Applicant"
              current={fd.guardian.ofApplicant}
              onChange={(v) => set({ guardian: { ...fd.guardian, ofApplicant: v } })}
              label="First Applicant"
            />
            <Radio
              name="gof"
              value="Second Applicant"
              current={fd.guardian.ofApplicant}
              onChange={(v) => set({ guardian: { ...fd.guardian, ofApplicant: v } })}
              label="Second Applicant"
            />
          </div>
        </Field>
        <Row>
          <Field label="DOB">
            <DateInput value={fd.guardian.dob} onChange={(e) => set({ guardian: { ...fd.guardian, dob: e.target.value } })} />
          </Field>
          <Field label="PAN" star>
            <CapsInput value={fd.guardian.pan} onChange={(v) => set({ guardian: { ...fd.guardian, pan: v } })} />
          </Field>
          <Field label="Customer ID">
            <CapsInput value={fd.guardian.customerId} onChange={(v) => set({ guardian: { ...fd.guardian, customerId: v } })} />
          </Field>
        </Row>
        <Row>
          <Field label="Email ID">
            <EmailInput value={fd.guardian.email} onChange={(e) => set({ guardian: { ...fd.guardian, email: e.target.value.toUpperCase() } })} />
          </Field>
          <Field label="Mobile No">
            <CapsInput value={fd.guardian.mobile} onChange={(v) => set({ guardian: { ...fd.guardian, mobile: v } })} />
          </Field>
          <Field label="Guardian Relation">
            <CapsInput value={fd.guardian.relation} onChange={(v) => set({ guardian: { ...fd.guardian, relation: v } })} />
          </Field>
        </Row>
      </section>

      <h3>Details of Bank Account (First Named Depositor) — Personalised Cancelled cheque leaf to be submitted</h3>
      <Row>
        <Field label="Bank Account No" star>
          <CapsInput value={fd.bankAccountNo} onChange={(v) => set({ bankAccountNo: v })} />
        </Field>
        <Field label="Bank Name" star>
          <CapsInput value={fd.bankName} onChange={(v) => set({ bankName: v })} />
        </Field>
      </Row>
      <Row>
        <Field label="MICR Code">
          <CapsInput value={fd.micr} onChange={(v) => set({ micr: v })} />
        </Field>
        <Field label="Branch">
          <CapsInput value={fd.bankBranch} onChange={(v) => set({ bankBranch: v })} />
        </Field>
        <Field label="IFSC Code">
          <CapsInput value={fd.ifsc} onChange={(v) => set({ ifsc: v })} />
        </Field>
        <Field label="Account">
          <div className="boxes">
            <Radio name="ac" value="Saving" current={fd.accountType} onChange={(v) => set({ accountType: v })} label="Saving" />
            <Radio name="ac" value="Current" current={fd.accountType} onChange={(v) => set({ accountType: v })} label="Current" />
          </div>
        </Field>
      </Row>

      <h3>Declaration</h3>
      <div className="decl small">
        <p>
          I/We have read the Terms and conditions of the company and accept that they are binding on me/us. I/We hereby declare that the
          first name depositor mentioned in my/our application is the beneficial owner of this deposit and as such he/she should be treated
          as the payee for the purpose of tax deduction under section 194A of the Income Tax Act, 1961. I/We hereby agree to abide by the
          attached terms and conditions governing the deposit. I/We have gone through the financials and other statements/representations/particulars
          furnished/made by the company and after careful consideration, I/We/am/are making the deposit with the company at my/our own risk
          and volition. I/We further declare that, I/We are authorised to make this deposit in the above mentioned scheme (Shriram Unnati
          Fixed Deposit) and that the amount used for this deposit is through legitimate source and does not involve directly or indirectly
          any proceeds of schedule of offence and/or is not designed for the purpose of any/or in contravention or evasion of the provisions
          of the Prevention of Money Laundering Act, 2002 and any Rules, Notifications, Guidelines or Directions there under, as amended from
          time to time. I/We shall provide any further information and/or do or make such acts or deeds that may be required in this context
          as requested by the Company. I/We agree to furnish any additional details as required by the Company. I/We further affirm that the
          details provided by me/us/are true in all respect and nothing has been concealed.
        </p>
        <p>
          I/We authorise Shriram Finance Limited to contact me/us, in person, by post, telephone, e-mail, using messaging services (SMS,
          Whatsapp, Bot) relating to my/our deposit. My personal / KYC details may be shared with Central KYC Registry. I hereby consent to
          receiving information from Central KYC Registry through SMS/Email on my registered number/email address. I hereby consent to
          download records from Central KYC Registry by using KYC identifier furnished by me/us. I/We confirm that the Company has explained
          and provided me/us the above information / Terms &amp; Conditions in the vernacular language (mentioned in the SFL Financial Page)
          and the same has been understood by me. I hereby consent to Shriram Finance Limited to update my contact information in Central KYC
          registry and understand that (in event of any such changes) by the Company.
        </p>
        <p>
          I hereby authorise and voluntarily opt for Aadhaar (UID) KYC e-KYC or offline verification, and submit to SFL my Aadhaar number,
          Virtual ID, e-Aadhaar, XML, Masked Aadhaar, Aadhaar details, demographic information, identity information, Aadhaar registered
          mobile number, face authentication details and/or biometric information (collectively, “Information”) for the purpose of
          establishing my identity / Aadhaar proof or in the capacity of guardian of my minor child&apos;s identity / address. I am informed
          by the SFL that in connection with Aadhaar services, SFL shall share Aadhaar number and/or biometrics with UIDAI/CIDR/AUA, and in
          response, the CIDR/AUA shall share with SFL the authentic e-KYC data or authentication status such as Aadhaar holder Name, Date of
          Birth, Address, Photo, and Registered Mobile Number.
        </p>
      </div>

      <h3>Signature of the Depositors</h3>
      <Hint>
        1. In case of deposits in joint names, all the depositors must sign on the provided space. 2. Thumb impression(s) to be attested by
        two witnesses. *Details are mandatory. #Details mandatory for E-Receipt. ^If investment amount is less than or equal to ₹50,000/- or
        aggregating to less than ₹5,00,000/- during financial year.
      </Hint>
      <div className="two-col">
        <PenBox label="First Applicant / Guardian" />
        <PenBox label="Second Applicant / Guardian" />
      </div>
      <div className="two-col">
        <div>
          <PenBox label="Witness 1 Signature" />
          <Field label="Name of the witness">
            <CapsInput value={fd.witness1Name} onChange={(v) => set({ witness1Name: v })} />
          </Field>
          <Field label="Address of the witness">
            <CapsArea value={fd.witness1Address} onChange={(v) => set({ witness1Address: v })} />
          </Field>
        </div>
        <div>
          <PenBox label="Witness 2 Signature" />
          <Field label="Name of the witness">
            <CapsInput value={fd.witness2Name} onChange={(v) => set({ witness2Name: v })} />
          </Field>
          <Field label="Address of the witness">
            <CapsArea value={fd.witness2Address} onChange={(v) => set({ witness2Address: v })} />
          </Field>
        </div>
      </div>

      <h3>Nomination Details U/s 45QB of RBI Act 1934 (Form DA1)</h3>
      <div className="boxes col">
        <Radio
          name="nom"
          value="no"
          current={fd.nominate}
          onChange={(v) => set({ nominate: v })}
          label="I/We the above mentioned depositor(s) do not wish to Nominate"
        />
        <Radio
          name="nom"
          value="yes"
          current={fd.nominate}
          onChange={(v) => set({ nominate: v })}
          label="I/We above mentioned depositors at current address in your records, nominate the following person to whom in the event of my/our/minor's death the amount of this deposit may be returned by Shriram Finance Limited"
        />
      </div>
      <Field label="Nominee name has to be printed on the certificate">
        <div className="boxes">
          <Radio name="printNom" value="Yes" current={fd.returnToDepositor} onChange={(v) => set({ returnToDepositor: v })} label="Yes" />
          <Radio name="printNom" value="No" current={fd.returnToDepositor} onChange={(v) => set({ returnToDepositor: v })} label="No" />
        </div>
      </Field>
      <Row>
        <Field label="Name of the Nominee: Mr/Ms" className="grow">
          <CapsInput value={fd.nomineeName} onChange={(v) => set({ nomineeName: v })} />
        </Field>
        <Field label="DOB of Nominee">
          <DateInput value={fd.nomineeDob} onChange={(e) => set({ nomineeDob: e.target.value })} />
        </Field>
      </Row>
      <Field label="Address of Nominee">
        <CapsArea value={fd.nomineeAddress} onChange={(v) => set({ nomineeAddress: v })} />
      </Field>
      <Row>
        <Field label="City">
          <CapsInput value={fd.nomineeCity} onChange={(v) => set({ nomineeCity: v })} />
        </Field>
        <Field label="Pincode">
          <CapsInput value={fd.nomineePin} onChange={(v) => set({ nomineePin: v })} />
        </Field>
      </Row>
      <Field label="Nominee Relationship with First Applicant">
        <div className="boxes wrap">
          {['Father', 'Mother', 'Son', 'Daughter', 'Spouse', 'Others (Specify)'].map((t) => (
            <Radio key={t} name="nrel" value={t} current={fd.nomineeRelation} onChange={(v) => set({ nomineeRelation: v })} label={t} />
          ))}
        </div>
      </Field>
      {fd.nomineeRelation.startsWith('Others') ? (
        <Field label="Other relationship">
          <CapsInput value={fd.nomineeRelationOther} onChange={(v) => set({ nomineeRelationOther: v })} />
        </Field>
      ) : null}
      <p className="mini">As the Nominee is minor on this date, I/We appoint</p>
      <Row>
        <Field label="Name of Appointee" className="grow">
          <CapsInput value={fd.appointeeName} onChange={(v) => set({ appointeeName: v })} />
        </Field>
        <Field label="DOB of Appointee">
          <DateInput value={fd.appointeeDob} onChange={(e) => set({ appointeeDob: e.target.value })} />
        </Field>
      </Row>
      <Field label="Address">
        <CapsArea value={fd.appointeeAddress} onChange={(v) => set({ appointeeAddress: v })} />
      </Field>
      <p className="hint">to receive amount of the said deposit on behalf of the nominee in event of my/our/minor&apos;s death during the minority of the nominee.</p>

      <h3>Signature of the Depositors For Nomination</h3>
      <div className="two-col">
        <PenBox label="First Applicant / Guardian" />
        <PenBox label="Second Applicant / Guardian" />
      </div>
      <Hint>
        Witness required in case if thumb impression is affixed by Depositor(s). Name of nominee should be same as that appearing on valid ID
        Proof of the Nominee.
      </Hint>
    </article>
  );
}
