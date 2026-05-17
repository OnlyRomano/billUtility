"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  addOneMonthToIsoDate,
  getDefaultBillPeriodRange,
  clampIsoToRange,
  clampNonNegative,
  formatBillPeriodForBill,
  formatCount,
  formatDueDateForBill,
  formatPHP,
  formatReadingPeriodCompact,
  parseIsoDateInput,
} from "../lib/billFormat";
import { exportBillPdf } from "../lib/exportBillPdf";
import { printUtilityBill } from "../lib/printBill";
import UtilityBillReceipt from "./UtilityBillReceipt";

function IsoDateInput({ id: idProp, value, onChange, min, max, placeholder }) {
  const autoId = useId();
  const inputId = idProp ?? autoId;
  const hiddenRef = useRef(null);
  const [text, setText] = useState(value ?? "");

  useEffect(() => {
    setText(value ?? "");
  }, [value]);

  const commit = useCallback(
    (raw) => {
      if (!raw.trim()) {
        onChange("");
        setText("");
        return;
      }
      const parsed = parseIsoDateInput(raw);
      if (!parsed) {
        setText(value ?? "");
        return;
      }
      const iso = clampIsoToRange(parsed, min, max);
      onChange(iso);
      setText(iso);
    },
    [min, max, onChange, value]
  );

  const openPicker = () => {
    const el = hiddenRef.current;
    if (el && typeof el.showPicker === "function") {
      try {
        el.showPicker();
      } catch {
        el.click();
      }
    } else if (el) {
      el.click();
    }
  };

  return (
    <div className="flex w-full min-w-0 rounded-md border border-neutral-300 bg-white shadow-sm focus-within:border-neutral-500 focus-within:ring-2 focus-within:ring-neutral-400">
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={text}
        aria-label={placeholder}
        title="Enter date as YYYY-MM-DD"
        onChange={(e) => setText(e.target.value)}
        onBlur={() => commit(text)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-neutral-400"
      />
      <button
        type="button"
        className="flex shrink-0 items-center border-l border-neutral-200 px-2.5 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
        onClick={openPicker}
        aria-label="Open calendar"
        title="Open calendar"
      >
        <CalendarIcon className="h-4 w-4" />
      </button>
      <input
        ref={hiddenRef}
        type="date"
        className="sr-only"
        tabIndex={-1}
        value={value || ""}
        min={min || undefined}
        max={max || undefined}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) {
            onChange("");
            setText("");
            return;
          }
          const clamped = clampIsoToRange(v, min, max);
          onChange(clamped);
          setText(clamped);
        }}
      />
    </div>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}


export default function UtilityBillApp() {
  const dueDateInputId = useId();
  const [billPeriodStart, setBillPeriodStart] = useState(
    () => getDefaultBillPeriodRange().start
  );
  const [billPeriodEnd, setBillPeriodEnd] = useState(() => getDefaultBillPeriodRange().end);
  const [reference, setReference] = useState("");
  const [stallNo, setStallNo] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [owner, setOwner] = useState("");

  const [electricPeriodStart, setElectricPeriodStart] = useState("");
  const [electricPeriodEnd, setElectricPeriodEnd] = useState("");
  const [electricPrev, setElectricPrev] = useState("");
  const [electricPresent, setElectricPresent] = useState("");
  const [electricRate, setElectricRate] = useState("");

  const [waterPeriodStart, setWaterPeriodStart] = useState("");
  const [waterPeriodEnd, setWaterPeriodEnd] = useState("");
  const [waterPrev, setWaterPrev] = useState("");
  const [waterPresent, setWaterPresent] = useState("");
  const [waterRate, setWaterRate] = useState("");
  const [waterAmount, setWaterAmount] = useState("");

  const [dueDate, setDueDate] = useState("");

  const electricPrevNum = parseFloat(electricPrev) || 0;
  const electricPresentNum = parseFloat(electricPresent) || 0;
  const electricRateNum = parseFloat(electricRate) || 0;

  const waterPrevNum = parseFloat(waterPrev) || 0;
  const waterPresentNum = parseFloat(waterPresent) || 0;

  const electricConsumption = clampNonNegative(electricPresentNum - electricPrevNum);
  const waterConsumption = clampNonNegative(waterPresentNum - waterPrevNum);

  const electricAmount = electricConsumption * electricRateNum;
  const waterAmountNum = parseFloat(waterAmount) || 0;
  const totalDue = electricAmount + waterAmountNum;

  const electricPeriodLabel = useMemo(
    () => formatReadingPeriodCompact(electricPeriodStart, electricPeriodEnd),
    [electricPeriodStart, electricPeriodEnd]
  );
  const waterPeriodLabel = useMemo(
    () => formatReadingPeriodCompact(waterPeriodStart, waterPeriodEnd),
    [waterPeriodStart, waterPeriodEnd]
  );
  const dueDateLabel = useMemo(() => formatDueDateForBill(dueDate), [dueDate]);
  const billPeriodLabel = useMemo(
    () => formatBillPeriodForBill(billPeriodStart, billPeriodEnd),
    [billPeriodStart, billPeriodEnd]
  );

  const downloadPdf = useCallback(async () => {
    try {
      const node = document.getElementById("utility-bill-print");
      if (!node) return;
      const safeRef = reference.replace(/[^\w\-#.]/g, "_") || "bill";
      await exportBillPdf(node, `utility-bill-${safeRef}.pdf`);
    } catch (err) {
      console.error(err);
    }
  }, [reference]);

  const printBill = useCallback(async () => {
    try {
      await printUtilityBill();
    } catch (err) {
      console.error(err);
    }
  }, []);

  return (
    <div className="bill-page mx-auto max-w-6xl px-4 py-8 text-neutral-900">
      <header className="no-print mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Utility bill</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Fill in the fields. Electric consumption and amount are calculated automatically; water values
          are entered manually. Print or download a PDF when you are done.
        </p>
      </header>

      <div className="bill-page-grid grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="no-print space-y-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Bill details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <DateRangeFields
              label="Bill period"
              start={billPeriodStart}
              end={billPeriodEnd}
              onStartChange={setBillPeriodStart}
              onEndChange={setBillPeriodEnd}
              autoEndOneMonth
              previewLabel={billPeriodLabel}
              className="sm:col-span-2"
            />
            <Field label="Utility bill no." value={reference} onChange={setReference} />
            <Field label="Stall no." value={stallNo} onChange={setStallNo} />
            <Field label="Business name" className="sm:col-span-2" value={businessName} onChange={setBusinessName} />
            <Field label="Owner" className="sm:col-span-2" value={owner} onChange={setOwner} />
          </div>

          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Electric</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <DateRangeFields
              label="Reading period"
              start={electricPeriodStart}
              end={electricPeriodEnd}
              onStartChange={setElectricPeriodStart}
              onEndChange={setElectricPeriodEnd}
              className="sm:col-span-2"
            />
            <Field label="Rate (per Kwh)" value={electricRate} onChange={setElectricRate} inputMode="decimal" />
            <Field label="Previous (Kwh)" value={electricPrev} onChange={setElectricPrev} inputMode="decimal" />
            <Field label="Present (Kwh)" value={electricPresent} onChange={setElectricPresent} inputMode="decimal" />
          </div>
          <p className="text-sm text-neutral-600">
            Consumption: <strong>{formatCount(electricConsumption)} Kwh</strong> · Amount:{" "}
            <strong>{formatPHP(electricAmount)}</strong>
          </p>

          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Water</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <DateRangeFields
              label="Reading period"
              start={waterPeriodStart}
              end={waterPeriodEnd}
              onStartChange={setWaterPeriodStart}
              onEndChange={setWaterPeriodEnd}
              className="sm:col-span-2"
            />
            <Field label="Rate" value={waterRate} onChange={setWaterRate} inputMode="decimal" />
            <Field label="Previous (m³)" value={waterPrev} onChange={setWaterPrev} inputMode="decimal" />
            <Field label="Present (m³)" value={waterPresent} onChange={setWaterPresent} inputMode="decimal" />
            <Field label="Amount" value={waterAmount} onChange={setWaterAmount} inputMode="decimal" />
          </div>
          <p className="text-sm text-neutral-600">
            On bill consumption: <strong>{formatCount(waterConsumption)} m³</strong> (from previous and
            present) · Amount: <strong>{formatPHP(waterAmountNum)}</strong>
          </p>

          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Payment</h2>
          <div className="flex max-w-md flex-col gap-1">
            <label htmlFor={dueDateInputId} className="text-xs font-medium text-neutral-600">
              Due date
            </label>
            <IsoDateInput
              id={dueDateInputId}
              value={dueDate}
              onChange={setDueDate}
              placeholder="YYYY-MM-DD"
            />
            <p className="text-[11px] text-neutral-500">
              On bill: <span className="font-medium text-neutral-700">{dueDateLabel}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={downloadPdf}
              className="rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-neutral-800"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={printBill}
              className="rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50"
            >
              Print
            </button>
          </div>
        </section>

        <div className="print-receipt-host lg:sticky lg:top-8 lg:self-start overflow-x-auto">
          <p className="no-print mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Preview</p>
          <UtilityBillReceipt
            billPeriodLabel={billPeriodLabel}
            reference={reference}
            stallNo={stallNo}
            businessName={businessName}
            owner={owner}
            electricPeriodLabel={electricPeriodLabel}
            electricPrev={electricPrev}
            electricPresent={electricPresent}
            electricConsumption={electricConsumption}
            electricRate={electricRate}
            electricAmount={electricAmount}
            waterPeriodLabel={waterPeriodLabel}
            waterPrev={waterPrev}
            waterPresent={waterPresent}
            waterConsumption={waterConsumption}
            waterRate={waterRate}
            waterAmount={waterAmountNum}
            totalDue={totalDue}
            dueDateLabel={dueDateLabel}
          />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, className = "", placeholder, inputMode }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-medium text-neutral-600">{label}</span>
      <input
        className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none ring-neutral-400 focus:border-neutral-500 focus:ring-2"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
      />
    </label>
  );
}

function DateRangeFields({
  label,
  start,
  end,
  onStartChange,
  onEndChange,
  className = "",
  startPlaceholder = "YYYY-MM-DD",
  endPlaceholder = "YYYY-MM-DD",
  autoEndOneMonth = false,
  previewLabel,
}) {
  const startId = useId();
  const endId = useId();
  const billPreview = previewLabel ?? formatReadingPeriodCompact(start, end);

  return (
    <fieldset className={`flex flex-col gap-2 ${className}`}>
      <legend className="text-xs font-medium text-neutral-600">{label}</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={startId} className="text-[11px] text-neutral-500">
            Start
          </label>
          <IsoDateInput
            id={startId}
            value={start}
            onChange={(v) => {
              onStartChange(v);
              if (autoEndOneMonth && v) {
                onEndChange(addOneMonthToIsoDate(v));
              } else if (end && v && end < v) {
                onEndChange(v);
              }
            }}
            max={end || undefined}
            placeholder={startPlaceholder}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={endId} className="text-[11px] text-neutral-500">
            End
          </label>
          <IsoDateInput
            id={endId}
            value={end}
            onChange={(v) => {
              onEndChange(v);
              if (start && v && v < start) onStartChange(v);
            }}
            min={start || undefined}
            placeholder={endPlaceholder}
          />
        </div>
      </div>
      <p className="text-[11px] text-neutral-500">
        On bill: <span className="font-medium text-neutral-700">{billPreview}</span>
      </p>
    </fieldset>
  );
}

