import { Box, CapsArea, CapsInput, DateInput, EmailInput, Field, Hint, MultiBox, PenBox, PhotoBox, Radio, Row, useLocked } from './ui.jsx';

const INCOME = [
  'Up to Rs. 3 Lakhs',
  'Above Rs. 3 Lakhs – 6 Lakhs',
  'Above Rs. 6 Lakhs – 15 Lakhs',
  'Above Rs. 15 Lakhs – 30 Lakhs',
  'Above Rs. 30 Lakhs',
];

const FUNDS = ['Salaried', 'Business Income', 'Agriculture', 'Investment Income', 'Sale of Asset', 'Other (Please Specify)'];

const POI = ['Aadhaar issued by UIDAI', 'Passport', 'Driving Licence', 'Voter ID Card', 'Others'];

export default function KycForm({ kyc, setKyc }) {
  const locked = useLocked();
  const set = (patch) => setKyc({ ...kyc, ...patch });
  const setRow = (i, patch) => {
    const taxRows = kyc.taxRows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    setKyc({ ...kyc, taxRows });
  };

  return (
    <article className="sheet kyc-sheet">
      <header className="sheet-head">
        <div className="brand">
          <div className="logo">SHRIRAM<br />Finance</div>
          <div>
            <h1>Shriram Finance Limited</h1>
            <h2>Know Your Customer (KYC) and FATCA–CRS Application Form (Resident Individuals)</h2>
          </div>
        </div>
        <p className="banner">Please fill the information in CAPITAL Letters and tick in appropriate places</p>
        <p className="legal">
          The information is sought under Prevention of Money Laundering Act, 2002, the rules notified thereunder and RBI guidelines on
          Know Your Customer. For existing Depositor, the information furnished herein will supersede the information available in the
          records of SFL.
        </p>
      </header>

      <h3>Customer&apos;s Details (as per KYC documents)</h3>
      <Row>
        <Field label="CKYC No (if any)">
          <CapsInput value={kyc.ckycNo} onChange={(v) => set({ ckycNo: v })} />
        </Field>
        <Field label="Customer ID (if existing Depositor)">
          <CapsInput value={kyc.customerId} onChange={(v) => set({ customerId: v })} />
        </Field>
        <Field label="PAN (Form 97)" star>
          <CapsInput value={kyc.pan} onChange={(v) => set({ pan: v })} />
        </Field>
        <Field label="Date of Birth" star>
          <DateInput value={kyc.dob} onChange={(e) => set({ dob: e.target.value })} />
        </Field>
      </Row>
      <Row>
        <Field label="Gender" star>
          <div className="boxes">
            <Radio name="gender" value="M" current={kyc.gender} onChange={(v) => set({ gender: v })} label="M" />
            <Radio name="gender" value="F" current={kyc.gender} onChange={(v) => set({ gender: v })} label="F" />
            <Radio name="gender" value="Others" current={kyc.gender} onChange={(v) => set({ gender: v })} label="Others" />
          </div>
        </Field>
        <Field label="Name" star className="grow">
          <CapsInput value={kyc.name} onChange={(v) => set({ name: v })} />
        </Field>
      </Row>
      <Row>
        <Field label="Father Name" star>
          <CapsInput value={kyc.fatherName} onChange={(v) => set({ fatherName: v })} />
        </Field>
        <Field label="Mother Name">
          <CapsInput value={kyc.motherName} onChange={(v) => set({ motherName: v })} />
        </Field>
        <Field label="Spouse Name (if Married)">
          <CapsInput value={kyc.spouseName} onChange={(v) => set({ spouseName: v })} />
        </Field>
      </Row>
      <Row className="with-photo">
        <div className="grow">
          <Row>
            <Field label="Country of Birth">
              <CapsInput value={kyc.countryOfBirth} onChange={(v) => set({ countryOfBirth: v })} />
            </Field>
            <Field label="City of Birth">
              <CapsInput value={kyc.cityOfBirth} onChange={(v) => set({ cityOfBirth: v })} />
            </Field>
          </Row>
          <h3>Communication Address</h3>
          <Field label="Address" star>
            <CapsArea value={kyc.commAddress} onChange={(v) => set({ commAddress: v })} />
          </Field>
          <Row>
            <Field label="City">
              <CapsInput value={kyc.commCity} onChange={(v) => set({ commCity: v })} />
            </Field>
            <Field label="State">
              <CapsInput value={kyc.commState} onChange={(v) => set({ commState: v })} />
            </Field>
            <Field label="Pin" star>
              <CapsInput value={kyc.commPin} onChange={(v) => set({ commPin: v })} inputMode="numeric" />
            </Field>
          </Row>
          <Row>
            <Field label="Country">
              <CapsInput value={kyc.commCountry} onChange={(v) => set({ commCountry: v })} />
            </Field>
            <Field label="Birth Place">
              <CapsInput value={kyc.birthPlace} onChange={(v) => set({ birthPlace: v })} />
            </Field>
            <Field label="Nationality" star>
              <CapsInput value={kyc.nationality} onChange={(v) => set({ nationality: v })} />
            </Field>
            <Field label="Citizenship" star>
              <CapsInput value={kyc.citizenship} onChange={(v) => set({ citizenship: v })} />
            </Field>
          </Row>
        </div>
        <PhotoBox value={kyc.photo} onChange={(photo) => set({ photo })} />
      </Row>

      <h3>Permanent Address</h3>
      <Field label="Address" star>
        <CapsArea value={kyc.permAddress} onChange={(v) => set({ permAddress: v })} />
      </Field>
      <Row>
        <Field label="City">
          <CapsInput value={kyc.permCity} onChange={(v) => set({ permCity: v })} />
        </Field>
        <Field label="State">
          <CapsInput value={kyc.permState} onChange={(v) => set({ permState: v })} />
        </Field>
        <Field label="Pin" star>
          <CapsInput value={kyc.permPin} onChange={(v) => set({ permPin: v })} inputMode="numeric" />
        </Field>
        <Field label="Marital Status" star>
          <div className="boxes">
            {['Married', 'Unmarried', 'Others'].map((s) => (
              <Radio key={s} name="marital" value={s} current={kyc.maritalStatus} onChange={(v) => set({ maritalStatus: v })} label={s} />
            ))}
          </div>
        </Field>
      </Row>
      <Row>
        <Field label="Mobile No" star>
          <CapsInput value={kyc.mobile} onChange={(v) => set({ mobile: v })} inputMode="tel" />
        </Field>
        <Field label="Email ID (mandatory for E-Receipt)" star>
          <EmailInput value={kyc.email} onChange={(e) => set({ email: e.target.value.toUpperCase() })} />
        </Field>
      </Row>
      <Hint>
        *If investment amount is less than or equal to ₹50,000/- or aggregating to less than ₹5,00,000/- during financial year.
        Fields marked * are mandatory.
      </Hint>

      <h3>Category</h3>
      <div className="boxes wrap">
        {['Salaried', 'Member of Public', 'Shareholder', 'Director', 'Self Employed', 'Relative of Director', 'Promoter'].map((c) => (
          <Radio key={c} name="category" value={c} current={kyc.category} onChange={(v) => set({ category: v })} label={c} />
        ))}
      </div>

      <h3>Occupation Type</h3>
      <div className="boxes wrap">
        {['Salaried', 'Professional', 'Self Employed', 'Student', 'Housewife', 'Retired', 'Other (Please specify)'].map((c) => (
          <Radio key={c} name="occupation" value={c} current={kyc.occupation} onChange={(v) => set({ occupation: v })} label={c} />
        ))}
      </div>
      {kyc.occupation.startsWith('Other') ? (
        <Field label="Occupation (other)">
          <CapsInput value={kyc.occupationOther} onChange={(v) => set({ occupationOther: v })} />
        </Field>
      ) : null}

      <h3>If Self Employed — Nature of Business</h3>
      <div className="boxes wrap">
        {[
          'Manufacturing',
          'Professional',
          'Service Provider',
          'Agriculture',
          'Trader',
          'Jewellers/Bullion',
          'Real Estate',
          'Stock Broker',
          'Other (Please specify)',
        ].map((c) => (
          <Radio key={c} name="biz" value={c} current={kyc.businessNature} onChange={(v) => set({ businessNature: v })} label={c} />
        ))}
      </div>
      {kyc.businessNature.startsWith('Other') ? (
        <Field label="Nature of business (other)">
          <CapsInput value={kyc.businessOther} onChange={(v) => set({ businessOther: v })} />
        </Field>
      ) : null}

      <h3>Please tick if the following is applicable to you</h3>
      <div className="boxes wrap">
        {['Politically Exposed Person (PEP)', 'Relative of PEP', 'Not Applicable'].map((c) => (
          <Radio key={c} name="pep" value={c} current={kyc.pep} onChange={(v) => set({ pep: v })} label={c} />
        ))}
      </div>

      <h3>Annual Income</h3>
      <div className="boxes wrap">
        {INCOME.map((c) => (
          <Radio key={c} name="income" value={c} current={kyc.annualIncome} onChange={(v) => set({ annualIncome: v })} label={c} />
        ))}
      </div>

      <h3>Source of Fund</h3>
      <MultiBox options={FUNDS} values={kyc.sourceOfFund} onChange={(sourceOfFund) => set({ sourceOfFund })} />
      {kyc.sourceOfFund.includes('Other (Please Specify)') ? (
        <Field label="Source of fund (other)">
          <CapsInput value={kyc.sourceOther} onChange={(v) => set({ sourceOther: v })} />
        </Field>
      ) : null}

      <h3>Person with Disability</h3>
      <Row>
        <Field label="Differently Abled">
          <div className="boxes">
            <Radio name="pwd" value="YES" current={kyc.differentlyAbled} onChange={(v) => set({ differentlyAbled: v })} label="YES" />
            <Radio name="pwd" value="NO" current={kyc.differentlyAbled} onChange={(v) => set({ differentlyAbled: v })} label="NO" />
          </div>
        </Field>
      </Row>
      <Hint>
        If yes and Investor is not an existing customer, then annexure for Differently abled (Annexure XXI) is to be attached.
      </Hint>

      <div className="two-col">
        <section>
          <h3>Proof of Identity (Self Attested)</h3>
          <div className="boxes col">
            {POI.map((c) => (
              <Radio key={c} name="poi" value={c} current={kyc.poiType} onChange={(v) => set({ poiType: v })} label={c} />
            ))}
          </div>
          <Row>
            <Field label="ID No.">
              <CapsInput value={kyc.poiIdNo} onChange={(v) => set({ poiIdNo: v })} />
            </Field>
            <Field label="Expiry Date">
              <DateInput value={kyc.poiExpiry} onChange={(e) => set({ poiExpiry: e.target.value })} />
            </Field>
          </Row>
        </section>
        <section>
          <h3>Proof of Address (Self Attested) to be attached</h3>
          <div className="boxes col">
            {POI.map((c) => (
              <Radio key={c} name="poa" value={c} current={kyc.poaType} onChange={(v) => set({ poaType: v })} label={c} />
            ))}
          </div>
          <Field label="Expiry Date">
            <DateInput value={kyc.poaExpiry} onChange={(e) => set({ poaExpiry: e.target.value })} />
          </Field>
        </section>
      </div>

      <h3>Please tick applicable tax resident declaration (Any one)</h3>
      <div className="boxes col">
        <Box
          label="I am a tax resident of India and not resident of any other country"
          checked={kyc.taxResidentIndiaOnly}
          onChange={(on) => set({ taxResidentIndiaOnly: on, taxResidentOther: on ? false : kyc.taxResidentOther })}
        />
        <Box
          label="I am a tax resident of the country/ies mentioned below"
          checked={kyc.taxResidentOther}
          onChange={(on) => set({ taxResidentOther: on, taxResidentIndiaOnly: on ? false : kyc.taxResidentIndiaOnly })}
        />
      </div>
      <Hint>Also include USA where the individual is a citizen/green card holder of USA.</Hint>
      {kyc.taxRows.map((row, i) => (
        <div className="tax-row" key={i}>
          <Row>
            <Field label="Country">
              <CapsInput value={row.country} onChange={(v) => setRow(i, { country: v })} />
            </Field>
            <Field label="Tax Identification Number">
              <CapsInput value={row.tin} onChange={(v) => setRow(i, { tin: v })} />
            </Field>
            <Field label="Identification Type (TIN or Other equivalent)">
              <CapsInput value={row.idType} onChange={(v) => setRow(i, { idType: v })} />
            </Field>
          </Row>
          <p className="mini">Address Type for Tax Purpose</p>
          <MultiBox
            options={['Residential', 'Business', 'Registered Office']}
            values={row.addressType}
            onChange={(addressType) => setRow(i, { addressType })}
          />
          <p className="mini">Address for Tax Purpose</p>
          <MultiBox
            options={['Permanent', 'Communication', 'Please tick below']}
            values={row.addrKind}
            onChange={(addrKind) => setRow(i, { addrKind })}
          />
          <Row>
            <Field label="Pin">
              <CapsInput value={row.pin} onChange={(v) => setRow(i, { pin: v })} />
            </Field>
            <Field label="State">
              <CapsInput value={row.state} onChange={(v) => setRow(i, { state: v })} />
            </Field>
            <Field label="Country">
              <CapsInput value={row.countryAddr} onChange={(v) => setRow(i, { countryAddr: v })} />
            </Field>
          </Row>
        </div>
      ))}
      {locked ? null : (
        <button
          type="button"
          className="ghost no-print"
          onClick={() =>
            setKyc({
              ...kyc,
              taxRows: [...kyc.taxRows, { country: '', tin: '', idType: '', addressType: [], addrKind: [], pin: '', state: '', countryAddr: '' }],
            })
          }
        >
          Add another tax country
        </button>
      )}
      <Hint>If Tax Identification No. is not available, kindly provide functional equivalent.</Hint>

      <h3>Depositor Declaration</h3>
      <ol className="decl">
        <li>I/We certify that I/We have read and understood the FATCA-CRS Terms and Conditions and hereby accept the same.</li>
        <li>
          All the particulars (including Taxpayer Identification Number) given hereby are true, correct and complete to the best of my/our
          knowledge and belief.
        </li>
        <li>I/We shall submit a new form to Shriram Finance Ltd. within 30 days if any information or certification in this form becomes incorrect/changed.</li>
        <li>
          I/We agree that as may be required by regulators, Shriram Finance Ltd. may be required to report my/our details to such
          regulators or close or suspend my/our account without any obligation of advising me/us of the same.
        </li>
        <li>
          I/We understand that Shriram Finance Ltd. is relying on this information for the compliance of FATCA-CRS and agree not to hold
          Shriram Finance Ltd., their employees, authorised agents, service providers, liable for any consequences (losses/costs) damaged in
          case of any of the above particulars being false, incorrect or incomplete or in case of my/our not intimating/delay in intimating
          any changes to the above particulars.
        </li>
        <li>
          I/We agree to indemnify Shriram Finance Ltd. in respect of any false, misleading, inaccurate and incomplete information regarding
          my/our “U.S.” person status or other Country Residential status or in respect of any other information as may be required under
          applicable tax laws.
        </li>
        <li>
          I/We certify that: a. I/We is (i) an applicant taxable as a US Person under the laws of the United States of America (“U.S.”) or
          any state or political subdivision thereof or therein, including the District of Columbia or any other states of the U.S., (ii) an
          estate the income of which is subject to U.S. federal income tax regardless of the source thereof. (This clause is applicable only
          if the depositor is a US Person/Citizen) b. I/We is an applicant taxable as a tax resident under the laws of country outside India.
          (This clause is applicable only if the depositor is a Tax Resident outside India.)
        </li>
      </ol>
      <Row>
        <Field label="Place">
          <CapsInput value={kyc.declPlace} onChange={(v) => set({ declPlace: v })} />
        </Field>
        <Field label="Date">
          <DateInput value={kyc.declDate} onChange={(e) => set({ declDate: e.target.value })} />
        </Field>
      </Row>
      <PenBox label="Signature of Depositor" />
    </article>
  );
}
