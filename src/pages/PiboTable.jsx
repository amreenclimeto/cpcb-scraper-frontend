import React, { useState, useEffect } from "react";
import ExcelLikeTable from "../components/ExcelLikeTable";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { piboService } from "../services/piboService";

const STATE_MAP = {
  maharashtra: "Maharashtra",
  "tamil nadu": "Tamil Nadu",
  "uttar pradesh": "Uttar Pradesh",
  delhi: "Delhi",
  karnataka: "Karnataka",
  gujarat: "Gujarat",
  rajasthan: "Rajasthan",
  "madhya pradesh": "Madhya Pradesh",
  bihar: "Bihar",
  punjab: "Punjab",
  haryana: "Haryana",
  "west bengal": "West Bengal",
  wb: "West Bengal",
  odisha: "Odisha",
  kerala: "Kerala",
  telangana: "Telangana",
  "andhra pradesh": "Andhra Pradesh",
  uttarakhand: "Uttarakhand",
  meghalaya: "Meghalaya",
};

const extractState = (address) => {
  if (!address) return "";

  const lower = address.toLowerCase();

  // ✅ 1. Direct match (best)
  for (const key in STATE_MAP) {
    if (lower.includes(key)) {
      return STATE_MAP[key];
    }
  }

  // ✅ 2. PIN code based fallback (India logic)
  const pincodeMatch = address.match(/\b\d{6}\b/);
  if (pincodeMatch) {
    const pin = pincodeMatch[0];

    if (pin.startsWith("4")) return "Maharashtra";
    if (pin.startsWith("6")) return "Tamil Nadu";
    if (pin.startsWith("2")) return "Uttar Pradesh";
    if (pin.startsWith("7")) return "West Bengal";
    if (pin.startsWith("3")) return "Gujarat";
    if (pin.startsWith("5")) return "Andhra Pradesh / Telangana";
    if (pin.startsWith("1")) return "Delhi / Haryana / Punjab";
  }

  // ❌ fallback
  return "Unknown";
};
const formatDate = (dateString) => {
  if (!dateString) return "-";

  const date = new Date(dateString);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const PiboTable = () => {

  const [activeTab, setActiveTab] = useState("current"); // 🔥 NEW

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const columns = [
    { key: "application_id", label: "Application ID", minWidth: 130 },
    { key: "company_legal_name", label: "Legal Name", minWidth: 250 },
    { key: "company_trade_name", label: "Trade Name", minWidth: 220 },
    { key: "applicant_type", label: "Applicant Type", minWidth: 130 },
    { key: "status", label: "Status", minWidth: 100 },
    { key: "created_on", label: "Created On", minWidth: 150 },
  ];

  const dummydata = [
    {
      company_id: 98231,
      company: "MAHARUDRA PRAKASH SHIRODKAR",
      address:
        "Shop No. 1, Hill View Apartment, Kusgav Road, Near Overhead Water Tank, Kusgav, Lonavala, Pune, Maharashtra,410401",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98371,
      company: "VELLINGIRI VADIVUKKARASI",
      address:
        "NO.31, KUMAR NAGAR EAST, , TIRUPUR, TIRUPPUR, TAMIL NADU, 641603",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 97289,
      company: "RAMBEE SOFTECH PRIVATE LIMITED",
      address:
        "663, sector-9, Vasundhara, Ghaziabad, Ghaziabad, Uttar Pradesh, 201012",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 95641,
      company: "MOBIS INDIA MODULE PRIVATE LIMITED",
      address:
        "Survey No. 142Part, 143Part, 194Part, Erramanchi Village, Penukonda Revenue Mandal, Ananthapuramu, Andhra Pradesh, 515110",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 97477,
      company: "FALCON GARDEN TOOLS PRIVATE LIMITED",
      address: "ALAMGIR, MALERKOTLA ROAD, LUDHIANA, PUNJAB-141116",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98316,
      company: "RAPID PET INDUSTRIES",
      address:
        "BLOCK NO-6, SY NO.169, NEAR GOVT SCHOOL, NARASIMHALAGUDEM VILLAGE, NIDAMANOOR MANDAL, Nalgonda, Telangana, 508278",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98344,
      company: "FRESHCARE INDUSTRIES PRIVATE LIMITED",
      address:
        "724 F/F, NEW FRIENDS COLONY, New Delhi, South East Delhi, Delhi, 110065",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98327,
      company: "RCHOBBYTECH SOLUTIONS PRIVATE LIMITED",
      address:
        "32, Behala College, Upen Banerjee Road, Parnasree, Kolkata, West Bengal, 700060",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98350,
      company: "H&L INTERNATIONAL",
      address:
        "D-13/D-14, H&L International, Jalandhar, Focal Point Industrial Area Extension, Jalandhar, Jalandhar, Punjab, 144004",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98341,
      company: "Helion Life Private Limited",
      address:
        "Shop No 51 Manoshi Complex CHS LTD,Plot No 5/6, Sector-3, Near Ghansoli Railway Station,Navi Mumbai,Thane, Maharashtra, 400701",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98351,
      company: "Q-ONE",
      address:
        "PLOT NO-732, PACE CITY,PHASE-11, SECTOR-37,GURGAON, Gurugram, Haryana, 122001",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98353,
      company: "IBRAHIM",
      address:
        "Ground Floor, Kh.No.734, Main Burari Road, Garg Cycle Store, Burari, New Delhi, Central Delhi, Delhi, 110084",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98362,
      company: "PMI TECHNOLOGY INDIA PRIVATE LIMITED",
      address:
        "5&6/23, 4-B, Tech Defence & Aerospace Park, JalaHobli, Bandikodigehalli, Bgnorth,, Bengaluru, Bengaluru Urban, Karnataka, 562149",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98373,
      company: "RAJNISH LALCHAND SINGH",
      address:
        "GODOWN NO 1288/1/A, DAVADAS EGA PADMA NAGAR NEW KANERI EKTA HOTEL PADMA NAGAR, BHIWANDI , THANE, MAHARASHTRA, 421302",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98287,
      company: "SOVI INTERNATIONAL TRADING PRIVATE LIMITED",
      address:
        "Group No. 7 Chawl No. 65, Room No. 1844, Tagore Nagar, Vikhroli East Mumbai- 400083",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98382,
      company: "KESHAV MODI",
      address:
        "BASEMENT,Shop No. 13,Pulo Ke Bhawan,Darjeeling More Jalpaimore Road,Golden Plaza,Mahananda Para, Siliguri,Darjeeling,WB 734001",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98222,
      company: "SANCHITA SANTOSH BHEGADE",
      address:
        "A-103, Jay Malhar, Parit Ali, Near Esha Enterprises, Nandimal Naka, Pen, Raigad, Maharashtra - 402107",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98364,
      company: "FLOORING INDIA CO",
      address:
        "PART-2, 228, SECTOR-29, HUDA, PANIPAT, Panipat, Haryana, 132103",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 97866,
      company: "FREETREND INDUSTRIAL INDIA PRIVATE LIMITED",
      address:
        "B400B, Indospace Industrial Park Pollivakkam, State Highway 57, Indospace Industrial Park Pollivakkam Tiruvallur Tamil Nadu 602002",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98196,
      company: "NEMLAXMI BOOKS INDIA PVT LTD",
      address:
        "PLOT NO. 10-27, Block No.223, Plot No.1-25 and 27, Block No.226, village Masma, Tal. Olpad, Dist. Surat, Gujarat-394540",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98240,
      company: "NUUO SOLUTIONS PRIVATE LIMITED",
      address:
        "1ST FLOOR, K NO. 128, NO 6A, NEXT TO DR. SHETTYS DENTAL, HORAMAVU AGARA, BENGALURU URBAN, KARNATAKA, 560043",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98244,
      company: "M/S TOUCH INC",
      address:
        "FIRST FLOOR, F-19, INDIUSTRAIL AREA, INDUTRIAL AREA, HARIDWAR, Haridwar, Uttarakhand, 249401",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98265,
      company: "EKTA MAULIKKUMAR GAJERA",
      address:
        "SHED NO. 3, EARTHBHUMI INDUSTRIAL ESTATE, BAKROL BUJRANG ROAD, BAKROL BUJRANG, AHMEDABAD",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98275,
      company: "SAGA AUTOMATION GROUP ( INDIA ) INDIA PRIVATE LIMITED",
      address:
        "S NO 103 , PLOT NO 52 , SENAPATI BAPAT ROAD BEHIND I C C SIVAJI HOUSING SOCIETY PUNE - 411016",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98289,
      company: "SPARTA GLASS PRIVATE LIMITED",
      address:
        "SPARTA GLASS PRIVATE LIMITED, FLAT NO 111, FIRST FLOOR, SHREYA PALACE, PATRAPADA, BHUBANESWAR, ODISHA-751019",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98291,
      company: "VANCOR IMPEX PRIVATE LIMITED",
      address:
        "1ST FLOOR, PLOT NO. 162, R D UDYOG, INDUSTRIAL AREA, PHASE 9, MOHALI, SAS NAGAR, PUNJAB, 160062",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98304,
      company: "WINDBRIDGE CONCEPTS PRIVATE LIMITED",
      address:
        "Plot No 1, Prime Industrial Park, Santej Vadsar Road, Santej, Taluka Kalol, Gandhinagar, Gujarat, 382721",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98309,
      company: "Sajith Kulathur Kandiyil",
      address: "NP 9/191A,Kalkudambil,Narikkuni,Kozhikode-673585",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98310,
      company: "MARVEL MOULDS",
      address:
        "GROUND FLOOR, F 4 B/3/, GANDHI NAGAR, ROAD NO 4, IDA KUKATPALLY, Hyderabad, Medchal Malkajgiri, Telangana, 500037",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98311,
      company: "VINEET GOYAL",
      address:
        "GR FLR PLOT NO 17, SHREE MAA BUSINESS HOUSE,, GODADDRA ROAD, PARVAT MAGOB UDHANA, Surat Gujarat, 395010",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98325,
      company: "FCS COMPUTER SYSTEMS S PTE LTD",
      address:
        "5th FLOOR, A-40, OFFICE NO-07, I-THUM TOWER-C, SECTOR-62, NOIDA",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98324,
      company: "THE FLYING BIRD ENTERPRISE",
      address:
        "GROUND FLOOR, 25, Mangal Estate, CHAKU, NR MUNCIPAL GARDEN, Rakhial, Ahmedabad, Ahmedabad, Gujarat, 380023",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98323,
      company: "GATEWAY TERMINALS INDIA PRIVATE LIMITED",
      address: "GTI House, Jn Port Sheva, Uran, Raigad, Maharashtra, 400707",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98328,
      company: "BRANDS-IN-MOTION PRIVATE LIMITED",
      address:
        "BASEMENT, E-29, E BLOCK KALKAJI, BLOCK E, New Delhi, South East Delhi, Delhi, 110019",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98330,
      company: "ZACK MARKETING (INDIA) PRIVATE LIMITED",
      address:
        "Kakrola, PLOT NO. 40, KAKROLA, A BLOCK, Vikas Vihar, New Delhi, South West Delhi, Delhi, 110078",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98331,
      company: "SUNIL CHANDRU JHURANI",
      address:
        "3RD FLOOR, A1 15, KANAYA NAGAR CHS LTD, KOPRI, COLONY, Thane, Maharashtra, 400603",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98333,
      company: "LAFARGE UMIAM MINING PRIVATE LIMITED",
      address:
        "3RD FLOOR,GOENKA TOWERS MORELLO COMPOUND, KEATING ROAD,SHILLONG,EAST KHASI HILLS, MEGHALAYA 793001",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98190,
      company: "SANIOLLA NATURALS PRIVATE LIMITED",
      address:
        "2209 22ND FLOOR, TOWER 1 DLF CORPORATE GREENS,, SEC 74  A, GURGAON, GURUGRAM, HARYANA, 122004",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98337,
      company: "BHAVIK HARSHADRAI SHAH",
      address: "KAPAD BAZAAR, PALITANA, BHAVNAGAR, GUJARAT- 364270",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98339,
      company: "PUNEET",
      address:
        "GROUND FLOOR, PLOT NO 833, SHOP NO 3, VILLAGE ALIPUR, NEAR ALLAHBAD BANK, Alipur, New Delhi, North Delhi, Delhi, 110036",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 97887,
      company: "YUGX LIFTS PRIVATE LIMITED",
      address:
        "B WEST -202, TAKSH COMPLEX. NR. ESI HOSPITAL GOTRI ROAD, T B SANATORIUM, VADODARA, GUJARAT, VADODARA,VADODARA, GUJARAT,  390021",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-18T09:55:26.412Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98066,
      company: "WILSON PEN PRIVATE LIMITED",
      address:
        "1ST FLOOR, B BLDG, WILSON HOUSE, OLD NAGARDAS ROAD, ANDHERI EAST, Mumbai City, Maharashtra, 400069",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-17T08:41:42.996Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98072,
      company: "COSMO SPECIALITY CHEMICALS PRIVATE LIMITED",
      address:
        "Plot No.B-14/10 Part-I, MIDC Waluj, Tal. Gangapur, Dist. Chhatrapati Sambhajinagar",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-17T08:41:42.996Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98148,
      company: "MOTHERSON ELECTRO COMPONENTS LIMITED",
      address:
        "Gat No 357, Chakan Ambethan Road, Priyanka Enterprises, Kharabwadi, Chakan, Pune, Maharashtra, 410501",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-17T08:41:42.996Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98274,
      company: "SHARETECH INNOVATIONS PRIVATE LIMITED",
      address:
        "GROUND FLOOR, D-50, AUSHTVINAYAK COMPLEX, O/S DARIYAPUR GATE, BARDOLPURA, Ahmedabad, Gujarat, 380004",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-17T08:41:42.996Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98279,
      company: "FREE2LIVE TECH SOLUTIONS PRIVATE LIMITED",
      address:
        "NO.11/6, THIRUVALLUVAR NAGAR, MNK ROAD, ALANDUR, Chennai, Chennai, Tamil Nadu, 600016",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-17T08:41:42.996Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98203,
      company: "PIINFINITY TECHNOLOGY SERVICES PRIVATE LIMITED",
      address:
        "58, BABHANPUR, PATTI RENDIGARPUR ROAD, ON WAY RUER TO RENDIGARAPUR, RUER, PATTI, PRATAPGARH, UTTAR PRADESH, 230135",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-17T08:41:42.996Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98239,
      company: "MOHAMMED SHAHID ABDUL WAHAB SHAIKH",
      address:
        "FLOOR-GRD, FLAT NO 20, AL QADRI CHAWL, SABOO SIDDIK ROAD, MUSAFIR KHANA ROAD ,FORT, MUMBAI, MUMBAI, MAHARASHTRA, 400001",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-17T08:41:42.996Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98305,
      company: "ASK FRAS-LE FRICTION PRIVATE LIMITED",
      address:
        "PLOT NO 446-D, SECTOR-8, IMT MANESAR, Gurugram, Haryana, 122050",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-17T08:41:42.996Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98202,
      company: "Gokilaa Gaarments",
      address:
        "3 306D Kuppandampalayam Veerapandi post tirupur tamilnadu 641605",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-17T08:41:42.996Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98307,
      company: "PENVER PRODUCTS LIMITED",
      address:
        "Door no: 285, Punnaparivaripalem road, Voduru post, Chillakuru mandal, SPSR Nellore Dist,  Andhra Pradesh-524410, India",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-17T08:41:42.996Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98258,
      company: "SAVISON &COMPANY",
      address:
        "1st Floor, 18, Avon Park, Park Lane, Park Street, Kolkata, West Bengal - 700016",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-17T08:41:42.996Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98295,
      company: "A FOUR ALL TECK WARE",
      address:
        "Floor Ground first No 7/1-5 godown No2 krishna complex govt senior primary school road bengaluru bengaluru urban karnataka 562162",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-17T08:41:42.996Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
    {
      company_id: 98266,
      company: "MK ILLUMINATION INDIA PRIVATE LIMITED",
      address:
        "C-360,LGF, HNO-1014/2,HUB AND OAK, Defence Colony, New Delhi, South East Delhi, Delhi, 110024",
      entity_type: "Importer",
      status: "Registered",
      is_new: true,
      first_seen_at: "2026-03-17T08:41:42.996Z",
      synced_at: "2026-03-18T09:55:26.412Z",
    },
  ];

  const updatedData = dummydata.map((item) => ({
    ...item,
    state: extractState(item.address),
  }));

  console.log(updatedData, "updatedData");

  // 🔥 API CALL
  useEffect(() => {
    fetchData();
  }, [pageIndex, pageSize, entityTypeFilter, statusFilter, search, activeTab]);

  const fetchData = async () => {
    if (loading) return;
    try {
      setLoading(true);

      const params = {
        page: pageIndex + 1,
        limit: pageSize,
        entityType: entityTypeFilter,
        status: statusFilter,
        search,
      };

      let res;

      // 🔥 API SWITCH
      if (activeTab === "current") {
        res = await piboService.getPiboData(params);
      } else {
        res = await piboService.getNewCompaniesData(params);
      }

      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error("API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  // 📊 export excel
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PIBO Data");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const file = new Blob([buffer], { type: "application/octet-stream" });

    saveAs(file, "pibo-data.xlsx");
  };

  const formattedData = data.map((item) => ({
    ...item,
    created_on: formatDate(item.created_on),
  }));
  return (
    <div className="">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">PIBO Dashboard</h2>

        <button
          onClick={exportExcel}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Download size={18} />
          Export Excel
        </button>
      </div>

      {/* 🔥 Tabs */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => {
            setActiveTab("current");
            setPageIndex(0);
          }}
          className={`px-4 py-2 rounded ${
            activeTab === "current" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Current Data
        </button>

        <button
          onClick={() => {
            setActiveTab("new");
            setPageIndex(0);
          }}
          className={`px-4 py-2 rounded ${
            activeTab === "new" ? "bg-green-600 text-white" : "bg-gray-200"
          }`}
        >
          New Companies 🚀
        </button>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow border">
        {/* Toolbar */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex gap-4">
            {/* Search */}
            <input
              placeholder="Search..."
              className="border px-3 py-2 rounded w-60"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageIndex(0);
              }}
            />

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPageIndex(0);
              }}
              className="border px-3 py-2 rounded"
            >
              <option value="">All Status</option>
              <option value="Approved">Approved</option>
              <option value="In Progress">In Progress</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Entity */}
            <select
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value);
                setPageIndex(0);
              }}
              className="border px-3 py-2 rounded"
            >
              <option value="">All Entity</option>
              <option value="Brand Owner">Brand Owner</option>
              <option value="Producer">Producer</option>
              <option value="Importer">Importer</option>
            </select>
          </div>

          {/* Page Size */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPageIndex(0);
            }}
            className="border px-2 py-1 rounded"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>

        {/* Table */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : (
            <ExcelLikeTable columns={columns} data={formattedData} />
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center p-4 border-t text-sm">
          <span>
            Showing {total === 0 ? 0 : pageIndex * pageSize + 1} to{" "}
            {Math.min((pageIndex + 1) * pageSize, total)} of {total} entries
          </span>

          <div className="flex gap-2">
            <button
              disabled={pageIndex === 0}
              onClick={() => setPageIndex(pageIndex - 1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Prev
            </button>

            <button
              disabled={pageIndex + 1 >= totalPages}
              onClick={() => setPageIndex(pageIndex + 1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PiboTable;
