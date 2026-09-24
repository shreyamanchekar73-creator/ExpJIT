function blank(v) {
  return !String(v || '').trim();
}

export function missingFields(draft) {
  const { kyc, fd, office } = draft;
  const missing = [];
  const kycNeed = (ok, label) => {
    if (!ok) missing.push({ page: 'kyc', label });
  };
  const fdNeed = (ok, label) => {
    if (!ok) missing.push({ page: 'fd', label });
  };

  if (blank(office.branch)) missing.push({ page: 'hub', label: 'Branch (office)' });

  kycNeed(!blank(kyc.name), 'KYC: Name');
  kycNeed(!blank(kyc.fatherName), 'KYC: Father name');
  kycNeed(!blank(kyc.pan), 'KYC: PAN');
  kycNeed(!blank(kyc.dob), 'KYC: Date of birth');
  kycNeed(!blank(kyc.gender), 'KYC: Gender');
  kycNeed(!blank(kyc.commAddress), 'KYC: Communication address');
  kycNeed(!blank(kyc.commPin), 'KYC: Communication PIN');
  kycNeed(!blank(kyc.nationality), 'KYC: Nationality');
  kycNeed(!blank(kyc.citizenship), 'KYC: Citizenship');
  kycNeed(!blank(kyc.permAddress), 'KYC: Permanent address');
  kycNeed(!blank(kyc.permPin), 'KYC: Permanent PIN');
  kycNeed(!blank(kyc.maritalStatus), 'KYC: Marital status');
  kycNeed(!blank(kyc.mobile), 'KYC: Mobile');
  kycNeed(!blank(kyc.email), 'KYC: Email');
  kycNeed(!blank(kyc.category), 'KYC: Category');
  kycNeed(!blank(kyc.occupation), 'KYC: Occupation');
  if (kyc.occupation.startsWith('Other')) kycNeed(!blank(kyc.occupationOther), 'KYC: Occupation (other)');
  if (kyc.occupation === 'Self Employed') kycNeed(!blank(kyc.businessNature), 'KYC: Nature of business');
  kycNeed(!blank(kyc.pep), 'KYC: PEP declaration');
  kycNeed(!blank(kyc.annualIncome), 'KYC: Annual income');
  kycNeed(kyc.sourceOfFund.length > 0, 'KYC: Source of fund');
  kycNeed(!blank(kyc.differentlyAbled), 'KYC: Differently abled');
  kycNeed(!blank(kyc.poiType), 'KYC: Proof of identity');
  kycNeed(!blank(kyc.poaType), 'KYC: Proof of address');
  kycNeed(kyc.taxResidentIndiaOnly || kyc.taxResidentOther, 'KYC: Tax resident declaration');
  if (kyc.taxResidentOther) {
    const row = kyc.taxRows[0] || {};
    kycNeed(!blank(row.country) && !blank(row.tin), 'KYC: Tax country and TIN');
  }
  kycNeed(!blank(kyc.declPlace), 'KYC: Declaration place');
  kycNeed(!blank(kyc.declDate), 'KYC: Declaration date');

  fdNeed(!blank(fd.periodMonths), 'FD: Deposit period (months)');
  fdNeed(!blank(fd.depositType), 'FD: Deposit type');
  if (fd.depositType === 'Fresh' || fd.depositType === 'Both') {
    fdNeed(!blank(fd.amount), 'FD: Amount (fresh)');
  }
  if (fd.depositType === 'Renewal' || fd.depositType === 'Both') {
    fdNeed(!blank(fd.oldCertNo), 'FD: Old certificate no.');
  }
  fdNeed(!blank(fd.receiptType), 'FD: Type of receipt');
  fdNeed(!blank(fd.maturityInstruction), 'FD: Maturity instruction');
  fdNeed(!blank(fd.modeOfOperation), 'FD: Mode of operation');
  fdNeed(!blank(fd.scheme), 'FD: Scheme');
  fdNeed(!blank(fd.seniorCitizen), 'FD: Senior citizen');
  fdNeed(!blank(fd.minor), 'FD: Minor');
  fdNeed(!blank(fd.first.name), 'FD: First applicant name (from KYC)');
  fdNeed(!blank(fd.first.dob), 'FD: First applicant DOB (from KYC)');
  fdNeed(!blank(fd.first.pan), 'FD: First applicant PAN (from KYC)');
  if (fd.receiptType === 'E-Receipt') fdNeed(!blank(fd.first.email), 'FD: Email (mandatory for E-Receipt)');
  fdNeed(!blank(fd.bankAccountNo), 'FD: Bank account no.');
  fdNeed(!blank(fd.bankName), 'FD: Bank name');
  fdNeed(!blank(fd.ifsc), 'FD: IFSC');
  fdNeed(!blank(fd.accountType), 'FD: Account type');
  fdNeed(!blank(fd.nominate), 'FD: Nomination choice');
  if (fd.nominate === 'yes') {
    fdNeed(!blank(fd.nomineeName), 'FD: Nominee name');
    fdNeed(!blank(fd.nomineeAddress), 'FD: Nominee address');
    fdNeed(!blank(fd.nomineeRelation), 'FD: Nominee relationship');
  }

  return missing;
}
