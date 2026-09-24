# Digital Shriram Finance forms

Staff fill the **KYC + FATCA-CRS** and **Fixed Deposit** sheets on a computer, print both pages on A4, and take the paper to the customer for a **pen signature**. There is no on-screen signing at the visit.

Drafts are stored only in this browser (`localStorage`). Office/branch details are kept separately so they reuse on the next customer. There is no login and no company server.

## Start

```bash
cd digital-forms
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build
npm run preview
```

## How staff use it

1. On **Home**, enter Business Associate Code, Affiliate BA, **Branch**, and Place once. These prefill the FD header and KYC declaration place.
2. Fill **KYC**. Type in capital letters; tick the same boxes as the paper. Name, DOB, PAN, CKYC, customer ID, email, mobile, and title copy onto the FD first applicant.
3. Fill the **FD application** (period, payment, bank, nomination). First applicant identity is read-only because it comes from KYC.
4. Open **Review**. Required empty fields are listed; print is blocked until they are filled (you can still confirm Print anyway).
5. **Print both (A4)** in one job, or **Download PDF** as a backup.
6. Take the printouts to the customer. They sign in the empty boxes with a pen.

**New customer** clears this customer’s draft and keeps office details.

## Forms included

- Know Your Customer (KYC) and FATCA–CRS Application Form (Resident Individuals)
- Application Form for Fixed Deposit (Resident Individual)

This folder sits beside the ExpJIT C project in the same repository and does not change the C build.
