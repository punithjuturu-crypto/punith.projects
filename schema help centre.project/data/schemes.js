// Add a new scheme: copy one block, give it a unique id,
// then add its rule in rules.js
var SCHEMES = [
  {
    id: "pm-kisan",
    name: "PM-KISAN",
    cat: "Farmers",
    benefit: "₹6,000 per year in 3 instalments, paid to the bank account.",
    who: "Farmer families with cultivable land. Income-tax payers and institutional landholders are excluded.",
    docs: "Aadhaar, land records, bank passbook",
    link: "https://pmkisan.gov.in"
  },
  {
    id: "pm-jay",
    name: "Ayushman Bharat PM-JAY",
    cat: "Health",
    benefit: "Health cover up to ₹5 lakh per family per year at empanelled hospitals.",
    who: "Families identified by SECC data; senior citizens aged 70+ are also covered.",
    docs: "Aadhaar, ration card",
    link: "https://pmjay.gov.in"
  },
  {
    id: "cmchis",
    name: "CM Comprehensive Health Insurance (TN)",
    cat: "Health",
    benefit: "Free treatment cover up to ₹5 lakh per family per year in Tamil Nadu.",
    who: "Tamil Nadu families with annual income up to about ₹1.2 lakh.",
    docs: "Family card, income certificate",
    link: "https://www.cmchistn.com"
  },
  {
    id: "ujjwala",
    name: "PM Ujjwala Yojana",
    cat: "Women",
    benefit: "Free LPG connection for the household.",
    who: "Adult women from poor households without an LPG connection.",
    docs: "Aadhaar, ration card, bank account",
    link: "https://www.pmuy.gov.in"
  },
  {
    id: "pmay",
    name: "PM Awas Yojana",
    cat: "Housing",
    benefit: "Financial help to build or buy a house, including interest subsidy.",
    who: "Families without a pucca house; income limits depend on category (EWS/LIG/MIG).",
    docs: "Aadhaar, income proof, bank account",
    link: "https://pmaymis.gov.in"
  },
  {
    id: "sukanya",
    name: "Sukanya Samriddhi Yojana",
    cat: "Women",
    benefit: "High-interest savings account for a girl child's education and marriage.",
    who: "Account opened by a parent or guardian for a girl up to 10 years old.",
    docs: "Birth certificate, parent ID",
    link: "https://www.indiapost.gov.in"
  },
  {
    id: "apy",
    name: "Atal Pension Yojana",
    cat: "Pension",
    benefit: "Guaranteed monthly pension of ₹1,000 to ₹5,000 after age 60.",
    who: "Age 18 to 40 with a bank account. Income-tax payers are not eligible.",
    docs: "Aadhaar, bank account, mobile number",
    link: "https://myscheme.gov.in"
  },
  {
    id: "suraksha",
    name: "PM Suraksha Bima / Jeevan Jyoti",
    cat: "Insurance",
    benefit: "₹2 lakh accident cover (PMSBY) and ₹2 lakh life cover (PMJJBY) at very low premium.",
    who: "Bank account holders: PMSBY age 18–70, PMJJBY age 18–50.",
    docs: "Bank account, Aadhaar",
    link: "https://myscheme.gov.in"
  },
  {
    id: "mudra",
    name: "PM Mudra Yojana",
    cat: "Business",
    benefit: "Collateral-free business loans up to ₹20 lakh (Shishu, Kishore, Tarun, Tarun Plus).",
    who: "Small and micro non-farm business owners, or those starting one.",
    docs: "ID, address proof, business plan",
    link: "https://www.mudra.org.in"
  },
  {
    id: "vishwakarma",
    name: "PM Vishwakarma",
    cat: "Business",
    benefit: "Skill training, toolkit support and low-interest credit for artisans.",
    who: "Traditional artisans and craftspeople aged 18+ in the listed trades.",
    docs: "Aadhaar, trade proof, bank account",
    link: "https://pmvishwakarma.gov.in"
  },
  {
    id: "kmut",
    name: "Kalaignar Magalir Urimai Thogai (TN)",
    cat: "Women",
    benefit: "₹1,000 per month to the woman head of the family.",
    who: "Tamil Nadu women heads of family, 21+, with annual family income under about ₹2.5 lakh and other asset limits.",
    docs: "Ration card, Aadhaar, bank account",
    link: "https://www.tn.gov.in"
  },
  {
    id: "puthumai",
    name: "Puthumai Penn (TN)",
    cat: "Education",
    benefit: "₹1,000 per month for girls pursuing higher education.",
    who: "Tamil Nadu girls who studied classes 6–12 in government schools and enrol in college.",
    docs: "School certificate, college ID, bank account",
    link: "https://www.tn.gov.in"
  },
  {
    id: "pudhalvan",
    name: "Tamil Pudhalvan (TN)",
    cat: "Education",
    benefit: "₹1,000 per month for boys pursuing higher education.",
    who: "Tamil Nadu boys who studied classes 6–12 in government schools and enrol in college.",
    docs: "School certificate, college ID, bank account",
    link: "https://www.tn.gov.in"
  }
];
