import React, { useEffect, useMemo, useState } from "react";

const Section = ({ title, children }) => (
  <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 12, background: "white" }}>
    <div style={{ fontWeight: 700, marginBottom: 10 }}>{title}</div>
    {children}
  </div>
);

const Label = ({ children }) => <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{children}</div>;

const Input = (props) => (
  <input
    {...props}
    style={{
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #d1d5db",
      borderRadius: 10,
      outline: "none"
    }}
  />
);

const Textarea = (props) => (
  <textarea
    {...props}
    style={{
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #d1d5db",
      borderRadius: 10,
      outline: "none",
      minHeight: 90
    }}
  />
);

const Row = ({ children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>{children}</div>
);

export default function NcrStatutoryReport() {
  const params = new URLSearchParams(window.location.search);
  const ncrId = params.get("id"); // open like /ncr-report?id=<NCR_ID>

  const token = useMemo(() => localStorage.getItem("token") || "", []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [meta, setMeta] = useState({ ncrCode: "" });
  const [report, setReport] = useState({
    equipmentIdentification: {
      clientName: "",
      siteName: "",
      equipmentType: "",
      equipmentCode: "",
      serialNumber: "",
      manufacturer: "",
      yearOfManufacture: "",
      countryOfOrigin: "",
      swl: "",
      mawp: "",
      designPressure: "",
      testPressure: "",
      location: "",
      gpsLat: "",
      gpsLng: ""
    },
    functionalAndLoadTestResults: {
      inspectionType: "",
      testDate: "",
      standardUsed: "",
      testLoadTon: "",
      testHeightM: "",
      radiusM: "",
      passFail: "PASS",
      instrument: "",
      calibrationDate: "",
      remarks: ""
    },
    identifiedDefects: [
      { title: "", description: "", location: "", severity: "MEDIUM", immediateAction: "", correctiveAction: "", dueDate: "", responsible: "" }
    ],
    statutoryRegulationsBreached: [
      { act: "Mines, Quarries, Works and Machinery Act", section: "", requirementBreached: "", riskStatement: "" }
    ],
    rootCauseConfirmed: {
      method: "5_WHYS",
      rootCauseStatement: "",
      contributingFactors: "",
      preventRecurrenceActions: "",
      managementSignOffName: "",
      managementSignOffDate: ""
    },
    photographicEvidence: {
      notes: "Upload handling can be added next (Supabase Storage). For now: list photo references/filenames here.",
      items: [{ caption: "", reference: "" }]
    },
    failureLoadTestCertificate: {
      certificateNumber: "",
      issuedBy: "",
      dateIssued: "",
      attachmentReference: ""
    },
    legalPositioning: {
      removeFromService: true,
      legalText:
        "This Statutory NCR is issued in terms of applicable Botswana statutory requirements. The equipment must be removed from service until corrective actions are completed and the equipment is re-inspected and certified fit for use by a competent person.",
      inspectorName: "",
      inspectorDate: "",
      managerName: "",
      managerDate: ""
    }
  });

  async function api(path, options = {}) {
    const res = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Request failed (${res.status}): ${text}`);
    }
    return res.json();
  }

  useEffect(() => {
    (async () => {
      try {
        if (!ncrId) throw new Error("Missing NCR id. Open this page with ?id=<NCR_ID>.");

        const data = await api(`/api/ncr/${ncrId}/report`);
        setMeta({ ncrCode: data.ncrCode || "" });

        // Merge existing reportJson if present
        if (data.reportJson && typeof data.reportJson === "object") {
          setReport((prev) => ({ ...prev, ...data.reportJson }));
        }
      } catch (e) {
        alert(e.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    try {
      setSaving(true);
      await api(`/api/ncr/${ncrId}/report`, {
        method: "PUT",
        body: JSON.stringify({ reportJson: report })
      });
      alert("✅ NCR report saved.");
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  function update(path, value) {
    setReport((prev) => {
      const copy = structuredClone(prev);
      let cur = copy;
      for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
      cur[path[path.length - 1]] = value;
      return copy;
    });
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading NCR report…</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>STATUTORY NON-CONFORMANCE REPORT (NCR)</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            {meta.ncrCode ? meta.ncrCode : "NCR"} <span style={{ fontSize: 14, color: "#6b7280" }}>({ncrId})</span>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #111827",
            background: saving ? "#e5e7eb" : "#111827",
            color: "white",
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer"
          }}
        >
          {saving ? "Saving…" : "Save NCR Report"}
        </button>
      </div>

      {/* 1. Equipment Identification */}
      <Section title="1. EQUIPMENT IDENTIFICATION">
        <Row>
          <div>
            <Label>Client Name</Label>
            <Input value={report.equipmentIdentification.clientName} onChange={(e) => update(["equipmentIdentification", "clientName"], e.target.value)} />
          </div>
          <div>
            <Label>Site Name</Label>
            <Input value={report.equipmentIdentification.siteName} onChange={(e) => update(["equipmentIdentification", "siteName"], e.target.value)} />
          </div>
        </Row>

        <Row>
          <div>
            <Label>Equipment Type</Label>
            <Input value={report.equipmentIdentification.equipmentType} onChange={(e) => update(["equipmentIdentification", "equipmentType"], e.target.value)} />
          </div>
          <div>
            <Label>Equipment Code</Label>
            <Input value={report.equipmentIdentification.equipmentCode} onChange={(e) => update(["equipmentIdentification", "equipmentCode"], e.target.value)} />
          </div>
        </Row>

        <Row>
          <div>
            <Label>Serial Number</Label>
            <Input value={report.equipmentIdentification.serialNumber} onChange={(e) => update(["equipmentIdentification", "serialNumber"], e.target.value)} />
          </div>
          <div>
            <Label>Manufacturer</Label>
            <Input value={report.equipmentIdentification.manufacturer} onChange={(e) => update(["equipmentIdentification", "manufacturer"], e.target.value)} />
          </div>
        </Row>

        <Row>
          <div>
            <Label>Year of Manufacture</Label>
            <Input value={report.equipmentIdentification.yearOfManufacture} onChange={(e) => update(["equipmentIdentification", "yearOfManufacture"], e.target.value)} />
          </div>
          <div>
            <Label>Country of Origin</Label>
            <Input value={report.equipmentIdentification.countryOfOrigin} onChange={(e) => update(["equipmentIdentification", "countryOfOrigin"], e.target.value)} />
          </div>
        </Row>

        <Row>
          <div>
            <Label>SWL (Lifting)</Label>
            <Input value={report.equipmentIdentification.swl} onChange={(e) => update(["equipmentIdentification", "swl"], e.target.value)} />
          </div>
          <div>
            <Label>MAWP (Pressure)</Label>
            <Input value={report.equipmentIdentification.mawp} onChange={(e) => update(["equipmentIdentification", "mawp"], e.target.value)} />
          </div>
        </Row>

        <Row>
          <div>
            <Label>Design Pressure</Label>
            <Input value={report.equipmentIdentification.designPressure} onChange={(e) => update(["equipmentIdentification", "designPressure"], e.target.value)} />
          </div>
          <div>
            <Label>Test Pressure</Label>
            <Input value={report.equipmentIdentification.testPressure} onChange={(e) => update(["equipmentIdentification", "testPressure"], e.target.value)} />
          </div>
        </Row>

        <Row>
          <div>
            <Label>Location</Label>
            <Input value={report.equipmentIdentification.location} onChange={(e) => update(["equipmentIdentification", "location"], e.target.value)} />
          </div>
          <div>
            <Label>GPS (Lat / Lng)</Label>
            <Row>
              <Input value={report.equipmentIdentification.gpsLat} onChange={(e) => update(["equipmentIdentification", "gpsLat"], e.target.value)} placeholder="Lat" />
              <Input value={report.equipmentIdentification.gpsLng} onChange={(e) => update(["equipmentIdentification", "gpsLng"], e.target.value)} placeholder="Lng" />
            </Row>
          </div>
        </Row>
      </Section>

      {/* 2. Functional & Load Test Results */}
      <Section title="2. FUNCTIONAL & LOAD TEST RESULTS">
        <Row>
          <div>
            <Label>Inspection/Test Type</Label>
            <Input value={report.functionalAndLoadTestResults.inspectionType} onChange={(e) => update(["functionalAndLoadTestResults", "inspectionType"], e.target.value)} />
          </div>
          <div>
            <Label>Test Date</Label>
            <Input type="date" value={report.functionalAndLoadTestResults.testDate} onChange={(e) => update(["functionalAndLoadTestResults", "testDate"], e.target.value)} />
          </div>
        </Row>

        <Row>
          <div>
            <Label>Standard/Method Used</Label>
            <Input value={report.functionalAndLoadTestResults.standardUsed} onChange={(e) => update(["functionalAndLoadTestResults", "standardUsed"], e.target.value)} />
          </div>
          <div>
            <Label>Pass/Fail</Label>
            <Input value={report.functionalAndLoadTestResults.passFail} onChange={(e) => update(["functionalAndLoadTestResults", "passFail"], e.target.value)} />
          </div>
        </Row>

        <Row>
          <div>
            <Label>Test Load (ton)</Label>
            <Input value={report.functionalAndLoadTestResults.testLoadTon} onChange={(e) => update(["functionalAndLoadTestResults", "testLoadTon"], e.target.value)} />
          </div>
          <div>
            <Label>Test Height (m) / Radius (m)</Label>
            <Row>
              <Input value={report.functionalAndLoadTestResults.testHeightM} onChange={(e) => update(["functionalAndLoadTestResults", "testHeightM"], e.target.value)} placeholder="Height m" />
              <Input value={report.functionalAndLoadTestResults.radiusM} onChange={(e) => update(["functionalAndLoadTestResults", "radiusM"], e.target.value)} placeholder="Radius m" />
            </Row>
          </div>
        </Row>

        <Row>
          <div>
            <Label>Instrument Used</Label>
            <Input value={report.functionalAndLoadTestResults.instrument} onChange={(e) => update(["functionalAndLoadTestResults", "instrument"], e.target.value)} />
          </div>
          <div>
            <Label>Calibration Date</Label>
            <Input type="date" value={report.functionalAndLoadTestResults.calibrationDate} onChange={(e) => update(["functionalAndLoadTestResults", "calibrationDate"], e.target.value)} />
          </div>
        </Row>

        <div>
          <Label>Remarks</Label>
          <Textarea value={report.functionalAndLoadTestResults.remarks} onChange={(e) => update(["functionalAndLoadTestResults", "remarks"], e.target.value)} />
        </div>
      </Section>

      {/* 3. Identified Defects */}
      <Section title="3. IDENTIFIED DEFECTS">
        {report.identifiedDefects.map((d, idx) => (
          <div key={idx} style={{ padding: 12, border: "1px dashed #d1d5db", borderRadius: 12, marginBottom: 10 }}>
            <Row>
              <div>
                <Label>Defect Title</Label>
                <Input value={d.title} onChange={(e) => update(["identifiedDefects", idx, "title"], e.target.value)} />
              </div>
              <div>
                <Label>Severity</Label>
                <Input value={d.severity} onChange={(e) => update(["identifiedDefects", idx, "severity"], e.target.value)} placeholder="LOW / MEDIUM / HIGH / CRITICAL" />
              </div>
            </Row>

            <Row>
              <div>
                <Label>Location on Equipment</Label>
                <Input value={d.location} onChange={(e) => update(["identifiedDefects", idx, "location"], e.target.value)} />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={d.dueDate} onChange={(e) => update(["identifiedDefects", idx, "dueDate"], e.target.value)} />
              </div>
            </Row>

            <div>
              <Label>Description</Label>
              <Textarea value={d.description} onChange={(e) => update(["identifiedDefects", idx, "description"], e.target.value)} />
            </div>

            <Row>
              <div>
                <Label>Immediate Action Required</Label>
                <Textarea value={d.immediateAction} onChange={(e) => update(["identifiedDefects", idx, "immediateAction"], e.target.value)} />
              </div>
              <div>
                <Label>Corrective Action</Label>
                <Textarea value={d.correctiveAction} onChange={(e) => update(["identifiedDefects", idx, "correctiveAction"], e.target.value)} />
              </div>
            </Row>

            <div>
              <Label>Responsible Person</Label>
              <Input value={d.responsible} onChange={(e) => update(["identifiedDefects", idx, "responsible"], e.target.value)} />
            </div>
          </div>
        ))}

        <button
          onClick={() =>
            setReport((prev) => ({
              ...prev,
              identifiedDefects: [
                ...prev.identifiedDefects,
                { title: "", description: "", location: "", severity: "MEDIUM", immediateAction: "", correctiveAction: "", dueDate: "", responsible: "" }
              ]
            }))
          }
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #d1d5db", background: "white", fontWeight: 700 }}
        >
          + Add Defect
        </button>
      </Section>

      {/* 4. Statutory Regulations Breached */}
      <Section title="4. STATUTORY REGULATIONS BREACHED">
        {report.statutoryRegulationsBreached.map((r, idx) => (
          <div key={idx} style={{ padding: 12, border: "1px dashed #d1d5db", borderRadius: 12, marginBottom: 10 }}>
            <Row>
              <div>
                <Label>Act / Regulation</Label>
                <Input value={r.act} onChange={(e) => update(["statutoryRegulationsBreached", idx, "act"], e.target.value)} />
              </div>
              <div>
                <Label>Section / Reference</Label>
                <Input value={r.section} onChange={(e) => update(["statutoryRegulationsBreached", idx, "section"], e.target.value)} />
              </div>
            </Row>
            <div>
              <Label>Requirement Breached</Label>
              <Textarea value={r.requirementBreached} onChange={(e) => update(["statutoryRegulationsBreached", idx, "requirementBreached"], e.target.value)} />
            </div>
            <div>
              <Label>Risk Statement</Label>
              <Textarea value={r.riskStatement} onChange={(e) => update(["statutoryRegulationsBreached", idx, "riskStatement"], e.target.value)} />
            </div>
          </div>
        ))}

        <button
          onClick={() =>
            setReport((prev) => ({
              ...prev,
              statutoryRegulationsBreached: [...prev.statutoryRegulationsBreached, { act: "", section: "", requirementBreached: "", riskStatement: "" }]
            }))
          }
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #d1d5db", background: "white", fontWeight: 700 }}
        >
          + Add Regulation
        </button>
      </Section>

      {/* 5. Root Cause */}
      <Section title="5. ROOT CAUSE (CONFIRMED)">
        <Row>
          <div>
            <Label>RCA Method</Label>
            <Input value={report.rootCauseConfirmed.method} onChange={(e) => update(["rootCauseConfirmed", "method"], e.target.value)} placeholder="5_WHYS / FISHBONE / FAULT_TREE" />
          </div>
          <div>
            <Label>Management Sign-off Date</Label>
            <Input type="date" value={report.rootCauseConfirmed.managementSignOffDate} onChange={(e) => update(["rootCauseConfirmed", "managementSignOffDate"], e.target.value)} />
          </div>
        </Row>

        <div>
          <Label>Root Cause Statement (Confirmed)</Label>
          <Textarea value={report.rootCauseConfirmed.rootCauseStatement} onChange={(e) => update(["rootCauseConfirmed", "rootCauseStatement"], e.target.value)} />
        </div>

        <Row>
          <div>
            <Label>Contributing Factors</Label>
            <Textarea value={report.rootCauseConfirmed.contributingFactors} onChange={(e) => update(["rootCauseConfirmed", "contributingFactors"], e.target.value)} />
          </div>
          <div>
            <Label>Prevent Recurrence Actions</Label>
            <Textarea value={report.rootCauseConfirmed.preventRecurrenceActions} onChange={(e) => update(["rootCauseConfirmed", "preventRecurrenceActions"], e.target.value)} />
          </div>
        </Row>

        <div>
          <Label>Management Sign-off Name</Label>
          <Input value={report.rootCauseConfirmed.managementSignOffName} onChange={(e) => update(["rootCauseConfirmed", "managementSignOffName"], e.target.value)} />
        </div>
      </Section>

      {/* 6. Photographic Evidence */}
      <Section title="6. PHOTOGRAPHIC EVIDENCE">
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
          (Demo) Store filenames/links now. Next step: upload to Supabase Storage and store public URLs.
        </div>

        {report.photographicEvidence.items.map((p, idx) => (
          <Row key={idx}>
            <div>
              <Label>Caption</Label>
              <Input value={p.caption} onChange={(e) => update(["photographicEvidence", "items", idx, "caption"], e.target.value)} />
            </div>
            <div>
              <Label>Photo Reference (filename/url)</Label>
              <Input value={p.reference} onChange={(e) => update(["photographicEvidence", "items", idx, "reference"], e.target.value)} />
            </div>
          </Row>
        ))}

        <button
          onClick={() =>
            setReport((prev) => ({
              ...prev,
              photographicEvidence: { ...prev.photographicEvidence, items: [...prev.photographicEvidence.items, { caption: "", reference: "" }] }
            }))
          }
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #d1d5db", background: "white", fontWeight: 700, marginTop: 10 }}
        >
          + Add Photo Reference
        </button>
      </Section>

      {/* 7. Failure Load Test Certificate */}
      <Section title="7. FAILURE LOAD TEST CERTIFICATE">
        <Row>
          <div>
            <Label>Certificate Number</Label>
            <Input value={report.failureLoadTestCertificate.certificateNumber} onChange={(e) => update(["failureLoadTestCertificate", "certificateNumber"], e.target.value)} />
          </div>
          <div>
            <Label>Date Issued</Label>
            <Input type="date" value={report.failureLoadTestCertificate.dateIssued} onChange={(e) => update(["failureLoadTestCertificate", "dateIssued"], e.target.value)} />
          </div>
        </Row>

        <Row>
          <div>
            <Label>Issued By</Label>
            <Input value={report.failureLoadTestCertificate.issuedBy} onChange={(e) => update(["failureLoadTestCertificate", "issuedBy"], e.target.value)} />
          </div>
          <div>
            <Label>Attachment Reference (filename/url)</Label>
            <Input value={report.failureLoadTestCertificate.attachmentReference} onChange={(e) => update(["failureLoadTestCertificate", "attachmentReference"], e.target.value)} />
          </div>
        </Row>
      </Section>

      {/* Legal positioning */}
      <Section title="LEGAL POSITIONING">
        <div>
          <Label>Legal Text</Label>
          <Textarea value={report.legalPositioning.legalText} onChange={(e) => update(["legalPositioning", "legalText"], e.target.value)} />
        </div>

        <Row>
          <div>
            <Label>Inspector Name</Label>
            <Input value={report.legalPositioning.inspectorName} onChange={(e) => update(["legalPositioning", "inspectorName"], e.target.value)} />
          </div>
          <div>
            <Label>Inspector Date</Label>
            <Input type="date" value={report.legalPositioning.inspectorDate} onChange={(e) => update(["legalPositioning", "inspectorDate"], e.target.value)} />
          </div>
        </Row>

        <Row>
          <div>
            <Label>Manager Name</Label>
            <Input value={report.legalPositioning.managerName} onChange={(e) => update(["legalPositioning", "managerName"], e.target.value)} />
          </div>
          <div>
            <Label>Manager Date</Label>
            <Input type="date" value={report.legalPositioning.managerDate} onChange={(e) => update(["legalPositioning", "managerDate"], e.target.value)} />
          </div>
        </Row>
      </Section>

      <div style={{ height: 30 }} />
    </div>
  );
}
