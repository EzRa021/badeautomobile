import { Document, View, Text, StyleSheet } from "@react-pdf/renderer";
import { BasePage, Signature, COLORS } from "@/lib/pdf/letterhead";
import { formatDocDate, formatDateTime } from "@/lib/utils/dates";
import type { JobDelivery, CompanySettings } from "@/lib/types";

const b = { fontFamily: "Calibri", fontWeight: "bold" } as const;

const s = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  leftCol: { flex: 1, fontSize: 12, paddingTop: 22 },
  rightCol: { width: 190 },
  poNo: { fontSize: 12, marginBottom: 4 },
  box: { borderWidth: 1, borderColor: COLORS.line },
  boxRow: { flexDirection: "row" },
  boxLabel: {
    width: 62,
    borderRightWidth: 1,
    borderColor: COLORS.line,
    padding: 4,
    fontSize: 11,
    color: COLORS.muted,
  },
  boxValue: { flex: 1, padding: 4, fontSize: 13 },
  tin: { textAlign: "right", marginTop: 6, fontSize: 12 },
  titleWrap: {
    alignSelf: "center",
    borderWidth: 1.4,
    borderColor: COLORS.line,
    borderRadius: 22,
    paddingVertical: 5,
    paddingHorizontal: 26,
    marginTop: 12,
    marginBottom: 12,
  },
  title: { fontSize: 19, fontFamily: "Calibri", fontWeight: "bold", textAlign: "center" },

  fieldRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 9, fontSize: 12 },
  contRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 6 },
  leader: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.faint,
    borderStyle: "dashed",
    marginLeft: 4,
    paddingBottom: 1,
    fontSize: 12,
  },
  phrase: { fontSize: 12, paddingHorizontal: 4 },
  handoverRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 9, fontSize: 12 },
  handoverLabel: { width: 190, fontSize: 12 },
});

/** A labelled field: value left-aligned on a dotted leader, plus `extra` empty dotted lines. */
function Field({ label, value, extra = 0 }: { label: string; value?: string | null; extra?: number }) {
  return (
    <View>
      <View style={s.fieldRow}>
        <Text>{label}</Text>
        <Text style={s.leader}>{value ?? ""}</Text>
      </View>
      {Array.from({ length: extra }).map((_, i) => (
        <View key={i} style={s.contRow}>
          <Text style={s.leader}> </Text>
        </View>
      ))}
    </View>
  );
}

export function JobDeliveryPdf({
  doc,
  company,
}: {
  doc: JobDelivery;
  company: CompanySettings | null;
}) {
  const tin = company?.tin ?? "20724729-001";
  const addressLines = (doc.customer_address ?? "").split("\n");

  return (
    <Document title={`Job Delivery ${doc.jd_no}`} author="Bade Automobile Ltd">
      <BasePage paddingHorizontal={72}>
        {/* Header */}
        <View style={s.head}>
          <View style={s.leftCol}>
            <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
              <Text style={b}>TO: </Text>
              <Text style={s.leader}>{doc.customer_name}</Text>
            </View>
            {addressLines.map((l, i) => (
              <View key={i} style={s.contRow}>
                <Text style={s.leader}>{l}</Text>
              </View>
            ))}
          </View>
          <View style={s.rightCol}>
            <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 4 }}>
              <Text style={{ fontSize: 12 }}>PO No: </Text>
              <Text style={s.leader}>{doc.po_no ?? ""}</Text>
            </View>
            <View style={s.box}>
              <View style={[s.boxRow, { borderBottomWidth: 1, borderColor: COLORS.line }]}>
                <Text style={s.boxLabel}>Invoice No</Text>
                <Text style={s.boxValue}>{doc.jd_no}</Text>
              </View>
              <View style={s.boxRow}>
                <Text style={s.boxLabel}>Date</Text>
                <Text style={s.boxValue}>{formatDocDate(doc.delivery_date)}</Text>
              </View>
            </View>
            <Text style={s.tin}>
              <Text style={b}>TIN NO: </Text>
              {tin}
            </Text>
          </View>
        </View>

        {/* Title */}
        <View style={s.titleWrap}>
          <Text style={s.title}>JOB DELIVERY REPORT</Text>
        </View>

        {/* Work description: <work> ...has been carried out on... <vehicle> */}
        <Text style={{ fontSize: 12 }}>Work Description:</Text>
        <View style={[s.fieldRow, { marginTop: 4 }]}>
          <Text style={[s.leader, { textAlign: "center", marginLeft: 0 }]}>{doc.work_done ?? ""}</Text>
          <Text style={s.phrase}>has been carried out on</Text>
          <Text style={[s.leader, { textAlign: "center", marginLeft: 0 }]}>{doc.vehicle ?? ""}</Text>
        </View>
        <View style={s.contRow}>
          <Text style={s.leader}> </Text>
        </View>

        <Field label="Items Changed: " value={doc.items_changed} extra={1} />
        <Field label="Note: " value={doc.note} />
        <Field label="Next Service: " value={doc.next_service} />
        <Field label="Accessories Found on Vehicle: " value={doc.accessories_found} extra={2} />
        <Field label="Accessories Returned with Vehicle: " value={doc.accessories_returned} extra={2} />

        {/* Handover block — values centered on their lines */}
        <View style={{ marginTop: 16 }}>
          {[
            { label: "Date In and Time:", value: doc.date_in ? formatDateTime(doc.date_in) : "" },
            { label: "Date Out and Time:", value: doc.date_out ? formatDateTime(doc.date_out) : "" },
            { label: "Driver's Name and Signature:", value: doc.driver_name ?? "" },
            { label: "Vehicle Coordinator Sign:", value: doc.coordinator_sign ?? "" },
            { label: "Engineering Inspector Sign:", value: doc.inspector_sign ?? "" },
          ].map((f, i) => (
            <View style={s.handoverRow} key={i}>
              <Text style={s.handoverLabel}>{f.label}</Text>
              <Text style={[s.leader, { textAlign: "center" }]}>{f.value}</Text>
            </View>
          ))}
        </View>

        <Signature prefix="For: " name="Bade Automobile Ltd" thanks="Yours Faithfully" />
      </BasePage>
    </Document>
  );
}
