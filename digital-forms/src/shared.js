function titleFromGender(gender) {
  if (gender === 'M') return 'MR';
  if (gender === 'F') return 'MS';
  if (gender === 'Others') return 'MX';
  return '';
}

export function firstFromKyc(kyc, first = {}) {
  return {
    ...first,
    title: titleFromGender(kyc.gender) || first.title || '',
    name: kyc.name || '',
    ckyc: kyc.ckycNo || '',
    dob: kyc.dob || '',
    pan: kyc.pan || '',
    customerId: kyc.customerId || '',
    email: kyc.email || '',
    mobile: kyc.mobile || '',
  };
}

export function withShared(draft) {
  const office = draft.office || {};
  const kyc = {
    ...draft.kyc,
    declPlace: draft.kyc.declPlace || office.place || '',
  };
  return {
    ...draft,
    kyc,
    fd: {
      ...draft.fd,
      first: firstFromKyc(kyc, draft.fd.first),
    },
  };
}
