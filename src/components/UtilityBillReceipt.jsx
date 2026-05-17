/**
 * Bill layout for preview and PDF. Inline styles only (rgb/hex) so html2canvas
 * matches the on-screen preview without Tailwind / modern color parsing issues.
 */
import { formatCount, formatPHP } from '../lib/billFormat';

export const RECEIPT_WIDTH_PX = 400;

const receiptRoot = {
  width: RECEIPT_WIDTH_PX,
  maxWidth: RECEIPT_WIDTH_PX,
  margin: '0 auto',
  border: '2px solid #000000',
  backgroundColor: '#ffffff',
  color: '#000000',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 13,
  lineHeight: 1.375,
  boxSizing: 'border-box',
  backgroundImage: `repeating-linear-gradient(
    90deg,
    transparent,
    transparent 7px,
    rgba(0, 0, 0, 0.04) 7px,
    rgba(0, 0, 0, 0.04) 8px
  )`,
};

function BillRow({ label, value, isLast }) {
  return (
    <div
      style={{
        marginTop: 4,
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        borderBottom: isLast ? 'none' : '1px solid rgba(0, 0, 0, 0.2)',
        paddingBottom: 2,
        fontSize: 13,
      }}
    >
      <span>{label}</span>
      <span style={{ textAlign: 'right' }}>{value || '\u00a0'}</span>
    </div>
  );
}

function UtilityBlock({ titleLeft, titleMid, titleRight, rows }) {
  return (
    <div style={{ borderBottom: "1px solid #000000" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          borderBottom: "1px solid #000000",
          textAlign: "center",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <div style={{ borderRight: "1px solid #000000", padding: "4px 4px" }}>{titleLeft}</div>
        <div style={{ borderRight: "1px solid #000000", padding: "4px 4px" }}>{titleMid}</div>
        <div style={{ padding: "4px 4px" }}>{titleRight}</div>
      </div>
      <div style={{ padding: "4px 8px" }}>
        {rows.map((row, i) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              borderBottom: i === rows.length - 1 ? "none" : "1px solid rgba(0, 0, 0, 0.15)",
              padding: "2px 0",
              fontSize: 12,
              fontWeight: row.emphasize ? 600 : 400,
            }}
          >
            <span>{row.label}</span>
            <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UtilityBillReceipt({
  id = "utility-bill-print",
  billPeriodLabel,
  reference,
  stallNo,
  businessName,
  owner,
  electricPeriodLabel,
  electricPrev,
  electricPresent,
  electricConsumption,
  electricRate,
  electricAmount,
  waterPeriodLabel,
  waterPrev,
  waterPresent,
  waterConsumption,
  waterRate,
  waterAmount,
  totalDue,
  dueDateLabel,
}) {
  return (
    <div id={id} style={receiptRoot}>
      <div style={{ borderBottom: "1px solid #000000", padding: "8px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{billPeriodLabel}</span>
          <span>{reference || "\u00a0"}</span>
        </div>
        <BillRow label="Stall No." value={stallNo} />
        <BillRow label="Business Name" value={businessName} />
        <BillRow label="Owner" value={owner} isLast />
      </div>

      <UtilityBlock
        titleLeft="Utility"
        titleMid="Electric"
        titleRight={electricPeriodLabel}
        rows={[
          { label: "Previous Reading", value: `${formatCount(electricPrev)} Kwh` },
          { label: "Present Reading", value: `${formatCount(electricPresent)} Kwh` },
          { label: "Consumption", value: `${formatCount(electricConsumption)} Kwh` },
          { label: "Rate", value: String(electricRate ?? "") },
          { label: "Amount due", value: formatPHP(electricAmount), emphasize: true },
        ]}
      />

      <UtilityBlock
        titleLeft="Utility"
        titleMid="Water"
        titleRight={waterPeriodLabel}
        rows={[
          { label: "Previous Reading", value: `${formatCount(waterPrev)} m³` },
          { label: "Present Reading", value: `${formatCount(waterPresent)} m³` },
          { label: "Consumption", value: `${formatCount(waterConsumption)} m³` },
          { label: "Rate", value: waterRate || "\u00a0" },
          { label: "Amount due", value: formatPHP(waterAmount), emphasize: true },
        ]}
      />

      <div style={{ borderTop: "2px solid #000000", padding: "8px 12px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          <span>Total Amount Due</span>
          <span>{formatPHP(totalDue)}</span>
        </div>
        <BillRow label="Due Date" value={dueDateLabel} isLast />
      </div>
    </div>
  );
}
