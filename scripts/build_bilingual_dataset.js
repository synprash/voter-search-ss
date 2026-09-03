const fs = require("fs");

// 1. Read Marathi records for Booth 158 from POC index.html
const pocHtml = fs.readFileSync("/Users/prashantk/dev/electionapps/POC-voter-list-search-custom/index.html", "utf8");
const match = pocHtml.match(/const DATA = (\[.*?\]);/s);
const marathi158List = match ? JSON.parse(match[1]) : [];
console.log(`Loaded ${marathi158List.length} Marathi records from POC for Booth 158`);

// Map Marathi 158 by serial no and EPIC
const mr158BySerial = new Map();
const mr158ByEpic = new Map();
marathi158List.forEach(r => {
  const s = Number(r["मतदार क्र."]);
  if (s) mr158BySerial.set(s, r);
  const epic = (r["EPIC / मतदार ओळखपत्र"] || "").trim().toUpperCase();
  if (epic) mr158ByEpic.set(epic, r);
});

// 2. Read English raw records for Booth 158 & 157
const en158Raw = JSON.parse(fs.readFileSync("src/lib/data/booth-158-english-raw.json", "utf8"));
const en157Raw = JSON.parse(fs.readFileSync("src/lib/data/booth-157-english-raw.json", "utf8"));
console.log(`Loaded ${en158Raw.length} English boxes for 158, and ${en157Raw.length} for 157`);

function getRelationMR(relEN) {
  if (!relEN) return "नातेवाईक";
  const l = relEN.toLowerCase();
  if (l.includes("husband")) return "पतीचे नाव";
  if (l.includes("father")) return "वडिलांचे नाव";
  if (l.includes("mother")) return "आईचे नाव";
  return "इतर";
}

function getRelationEN(relMR) {
  if (!relMR) return "Relative";
  if (relMR.includes("पती")) return "Husband";
  if (relMR.includes("वडील") || relMR.includes("पिता")) return "Father";
  if (relMR.includes("आई") || relMR.includes("माता")) return "Mother";
  return "Other";
}

function getRoleEN(roleMR) {
  if (!roleMR) return "Member";
  if (roleMR.includes("पत्नी")) return "Spouse";
  if (roleMR.includes("मुलगा") || roleMR.includes("मुलगी")) return "Son/Daughter";
  if (roleMR.includes("प्रमुख")) return "Head";
  return "Member";
}

const finalVoters = [];

// Process Booth 158 (604 voters)
en158Raw.forEach((en, idx) => {
  const serialNo = idx + 1;
  const epicNo = (en.epicNo || "").trim();
  
  // Find matching Marathi record by serialNo or EPIC
  const mr = mr158BySerial.get(serialNo) || mr158ByEpic.get(epicNo.toUpperCase()) || {};
  
  const voterNameEN = en.name || (mr["मतदाराचे नाव"] || `Voter ${serialNo}`);
  const voterNameMR = mr["मतदाराचे नाव"] || voterNameEN;
  const relNameEN = en.relativeName || (mr["नात्याचे नाव"] || "");
  const relNameMR = mr["नात्याचे नाव"] || relNameEN;
  const relTypeEN = en.relationType ? getRelationEN(en.relationType) : getRelationEN(mr["नाते"] || "");
  const relTypeMR = mr["नाते"] || getRelationMR(relTypeEN);
  const genderEN = en.gender || (mr["लिंग"] === "महिला" ? "Female" : "Male");
  const genderMR = genderEN === "Female" ? "महिला" : "पुरुष";
  const age = en.age || Number(mr["वय"]) || 30;
  const familyId = mr["कुटुंब क्र."] ? Number(mr["कुटुंब क्र."]) : Math.ceil(serialNo / 3);
  const familyRoleMR = mr["भूमिका"] || (genderEN === "Female" && relTypeEN === "Husband" ? "पत्नी" : "सदस्य");
  const familyRoleEN = getRoleEN(familyRoleMR);
  const addressMR = mr["पत्ता"] || "कोंबडवाडी, चांदवड";
  const addressEN = en.houseNo ? `${en.houseNo}, Kombadvadi, Chandwad` : "Kombadvadi, Chandwad";

  finalVoters.push({
    id: `158-${serialNo}`,
    part_no: 158,
    assembly_no: 118,
    assembly_name_en: "Chandwad",
    assembly_name_mr: "चांदवड",
    parliamentary_no: 20,
    parliamentary_name_en: "Dindori",
    parliamentary_name_mr: "दिंडोरी",
    polling_station_en: "158 - Chandwad, Shri. Neminath Jain Primary School, Room No.5",
    polling_station_mr: "१५८ - चांदवड, श्री. नेमिनाथ जैन प्राथमिक शाळा, खोली क्र. ५",
    section_no: 1,
    section_name_en: "1-Kombadvadi Vasti Mangrulachi Pachivad Vasti Chandwad",
    section_name_mr: "१-कोंबडवाडी वस्ती मांगरुळाची पाचीवाड वस्ती चांदवड",
    serial_no: serialNo,
    epic_no: epicNo || mr["EPIC / मतदार ओळखपत्र"] || `TTZ${String(6000000 + serialNo)}`,
    voter_name_en: voterNameEN,
    voter_name_mr: voterNameMR,
    relation_type_en: relTypeEN,
    relation_type_mr: relTypeMR,
    relative_name_en: relNameEN,
    relative_name_mr: relNameMR,
    house_no: en.houseNo || mr["पत्ता"] || "",
    address_en: addressEN,
    address_mr: addressMR,
    age: age,
    gender_en: genderEN,
    gender_mr: genderMR,
    family_id: familyId,
    family_role_en: familyRoleEN,
    family_role_mr: familyRoleMR,
    photo_available: true,
    pdf_page_no: en.pageNo || Number(mr["PDF पान"]) || 3,
    audit_notes: mr["तपासणी नोंद"] || ""
  });
});

// Process Booth 157 (659 voters)
en157Raw.forEach((en, idx) => {
  const serialNo = idx + 1;
  const epicNo = (en.epicNo || "").trim() || `TTZ${String(7000000 + serialNo)}`;
  const genderEN = en.gender || (idx % 2 === 0 ? "Male" : "Female");
  const genderMR = genderEN === "Female" ? "महिला" : "पुरुष";
  const relTypeEN = en.relationType ? getRelationEN(en.relationType) : "Father";
  const relTypeMR = getRelationMR(relTypeEN);
  const voterNameEN = en.name || `Voter ${serialNo}`;
  const relNameEN = en.relativeName || `Relative ${serialNo}`;
  const familyId = Math.ceil(serialNo / 3);
  const familyRoleEN = genderEN === "Female" && relTypeEN === "Husband" ? "Spouse" : (serialNo % 3 === 1 ? "Head" : "Member");
  const familyRoleMR = familyRoleEN === "Spouse" ? "पत्नी" : (familyRoleEN === "Head" ? "प्रमुख" : "सदस्य");

  finalVoters.push({
    id: `157-${serialNo}`,
    part_no: 157,
    assembly_no: 118,
    assembly_name_en: "Chandwad",
    assembly_name_mr: "चांदवड",
    parliamentary_no: 20,
    parliamentary_name_en: "Dindori",
    parliamentary_name_mr: "दिंडोरी",
    polling_station_en: "157 - Chandwad, Shri. Neminath Jain Primary School, Room No.3",
    polling_station_mr: "१५७ - चांदवड, श्री. नेमिनाथ जैन प्राथमिक शाळा, खोली क्र. ३",
    section_no: 1,
    section_name_en: "1-Nagai Colony Ganesh Nagar Chandwad",
    section_name_mr: "१-नागाई कॉलनी गणेश नगर चांदवड",
    serial_no: serialNo,
    epic_no: epicNo,
    voter_name_en: voterNameEN,
    voter_name_mr: voterNameEN,
    relation_type_en: relTypeEN,
    relation_type_mr: relTypeMR,
    relative_name_en: relNameEN,
    relative_name_mr: relNameEN,
    house_no: en.houseNo || "",
    address_en: "Nagai Colony, Ganesh Nagar, Chandwad",
    address_mr: "नागाई कॉलनी, गणेश नगर, चांदवड",
    age: en.age || 35,
    gender_en: genderEN,
    gender_mr: genderMR,
    family_id: familyId,
    family_role_en: familyRoleEN,
    family_role_mr: familyRoleMR,
    photo_available: true,
    pdf_page_no: en.pageNo || 3,
    audit_notes: ""
  });
});

console.log(`Total compiled bilingual records: ${finalVoters.length}`);
fs.writeFileSync("src/lib/data/seed-voters.json", JSON.stringify(finalVoters, null, 2));
console.log("Successfully rebuilt seed-voters.json!");
