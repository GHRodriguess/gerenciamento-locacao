"use client";

import React, { useState, useMemo } from "react";
import {
  FileDown,
  Printer,
  Calendar as CalendarIcon,
  Search,
  Check,
  Sparkles,
  Filter,
  X,
} from "lucide-react";
import { Locacao, Brinquedo } from "@/types";
import { formatCurrency, formatTitleCase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LocacoesSpreadsheetProps {
  locacoes: Locacao[];
  brinquedos: Brinquedo[];
  onSelectLocacao?: (locacao: Locacao) => void;
}

type PeriodFilter =
  | "proximas"
  | "fim_de_semana"
  | "este_mes"
  | "todas"
  | "personalizado";

const TOY_ORDER_PRIORITY: Record<string, number> = {
  "cama-elastica-3-metros": 1,
  "cama-elastica-2,49-metros": 2,
  "cama-elastica-5-metros": 3,
  "piscina-de-bolinhas": 4,
};

export function getToyShortName(tipo: string): string {
  switch (tipo) {
    case "cama-elastica-3-metros":
      return "Pula 3M";
    case "cama-elastica-2,49-metros":
      return "Pula 2,49m";
    case "cama-elastica-5-metros":
      return "Pula 5M";
    case "piscina-de-bolinhas":
      return "Piscina";
    default:
      return formatTitleCase(tipo.replaceAll("-", " "));
  }
}

export function formatDateOnlyBR(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatNumberBR(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0,00";
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Escapes a string for PDF 1.4 literal string (...) using WinAnsiEncoding (Windows-1252 / Latin-1).
 * Characters >= 128 are encoded as 3-digit octal \ddd so the resulting PDF content is 100% 7-bit ASCII
 * and byte offsets in the xref table are exact.
 */
function pdfEscapeWinAnsi(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 0x28) {
      out += "\\(";
    } else if (code === 0x29) {
      out += "\\)";
    } else if (code === 0x5c) {
      out += "\\\\";
    } else if (code >= 0x20 && code <= 0x7e) {
      out += text[i];
    } else if (code >= 0xa0 && code <= 0xff) {
      out += "\\" + code.toString(8).padStart(3, "0");
    } else {
      // Fallback for characters outside Latin-1
      out += "?";
    }
  }
  return out;
}

function truncateTextToWidth(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  if (maxChars <= 3) return text.slice(0, maxChars);
  return text.slice(0, maxChars - 1) + "…";
}

/**
 * Generates a vector PDF (Landscape A4) styled like the classic yellow/grey spreadsheet.
 */
function generateSpreadsheetPdfBlob(
  rows: Locacao[],
  toyColumns: Brinquedo[],
  totalValor: number
): Blob {
  // Landscape A4 dimensions in points (1 pt = 1/72 inch)
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const margin = 24;
  const usableWidth = pageWidth - margin * 2;

  // Base columns widths (fixed proportions, scaled if many toys)
  const idxW = 24;
  const dateW = 68;
  const valorW = 58;
  const cidadeW = 88;
  const minToyW = 48;
  const maxToyW = 68;

  const toyCount = Math.max(toyColumns.length, 1);
  const fixedWithoutNameAndToys = idxW + dateW * 2 + valorW + cidadeW;

  // Calculate toy width and name width to fit nicely in usableWidth
  let toyW = Math.min(
    maxToyW,
    Math.max(
      minToyW,
      Math.floor((usableWidth - fixedWithoutNameAndToys - 130) / toyCount)
    )
  );
  let totalToysW = toyColumns.length * toyW;
  let nomeW = usableWidth - fixedWithoutNameAndToys - totalToysW;

  if (nomeW < 110 && toyColumns.length > 0) {
    nomeW = 110;
    toyW = Math.max(
      36,
      (usableWidth - fixedWithoutNameAndToys - nomeW) / toyColumns.length
    );
    totalToysW = toyColumns.length * toyW;
    nomeW = usableWidth - fixedWithoutNameAndToys - totalToysW;
  }

  const colWidths = [
    idxW,
    dateW,
    dateW,
    nomeW,
    valorW,
    cidadeW,
    ...toyColumns.map(() => toyW),
  ];

  const headerHeight = 24;
  const rowHeight = 20;
  const topTitleSpace = 26;
  const maxRowsPerPage = Math.max(
    1,
    Math.floor((pageHeight - margin * 2 - topTitleSpace - headerHeight * 2) / rowHeight)
  );

  // Split rows into pages
  const pages: Locacao[][] = [];
  if (rows.length === 0) {
    pages.push([]);
  } else {
    for (let i = 0; i < rows.length; i += maxRowsPerPage) {
      pages.push(rows.slice(i, i + maxRowsPerPage));
    }
  }

  const pageStreams: string[] = [];

  pages.forEach((pageRows, pageIndex) => {
    const ops: string[] = [];
    const startRowNumber = pageIndex * maxRowsPerPage;

    // Title bar at top
    const topY = pageHeight - margin;
    ops.push("0 0 0 rg");
    ops.push(
      `BT /F2 11 Tf ${margin} ${(topY - 12).toFixed(2)} Td (${pdfEscapeWinAnsi(
        "Relatorio de Locacoes"
      )}) Tj ET`
    );
    const emittedAt = `Gerado em ${formatDateOnlyBR(new Date().toISOString())} - Pagina ${
      pageIndex + 1
    }/${pages.length}`;
    ops.push("0.35 0.35 0.35 rg");
    ops.push(
      `BT /F1 8.5 Tf ${(pageWidth - margin - 165).toFixed(2)} ${(
        topY - 12
      ).toFixed(2)} Td (${pdfEscapeWinAnsi(emittedAt)}) Tj ET`
    );

    // Table Header Y
    let currentTopY = topY - topTitleSpace;
    const hBottomY = currentTopY - headerHeight;

    // Draw header cells
    const headers = [
      "",
      "Montagem",
      "Desmontagem",
      "Nome",
      "Valor",
      "Cidade",
      ...toyColumns.map((t) => getToyShortName(t.tipo)),
    ];

    let x = margin;
    headers.forEach((hText, colIdx) => {
      const w = colWidths[colIdx];
      // Background fill: col 0 is white, cols 1..5 are bright yellow (#FFFF00), cols >= 6 are light grey (#D9D9D9)
      if (colIdx >= 1 && colIdx <= 5) {
        ops.push("1 1 0 rg");
        ops.push(
          `${x.toFixed(2)} ${hBottomY.toFixed(2)} ${w.toFixed(
            2
          )} ${headerHeight.toFixed(2)} re f`
        );
      } else if (colIdx >= 6) {
        ops.push("0.85 0.85 0.85 rg");
        ops.push(
          `${x.toFixed(2)} ${hBottomY.toFixed(2)} ${w.toFixed(
            2
          )} ${headerHeight.toFixed(2)} re f`
        );
      }

      // Cell border
      ops.push("0 0 0 RG 0.6 w");
      ops.push(
        `${x.toFixed(2)} ${hBottomY.toFixed(2)} ${w.toFixed(
          2
        )} ${headerHeight.toFixed(2)} re S`
      );

      // Header text (bold)
      if (hText) {
        const fontSize = colIdx >= 6 && w < 52 ? 7.5 : 8.5;
        const maxChars = Math.max(4, Math.floor((w - 6) / (fontSize * 0.52)));
        const displayLabel = truncateTextToWidth(hText, maxChars);
        ops.push("0 0 0 rg");
        ops.push(
          `BT /F2 ${fontSize} Tf ${(x + 4).toFixed(2)} ${(
            hBottomY + 7
          ).toFixed(2)} Td (${pdfEscapeWinAnsi(displayLabel)}) Tj ET`
        );
      }

      x += w;
    });

    currentTopY = hBottomY;

    // Draw data rows
    pageRows.forEach((loc, rIdx) => {
      const rBottomY = currentTopY - rowHeight;
      const globalIndex = startRowNumber + rIdx + 1;
      const rentedIds = new Set((loc.brinquedos || []).map((b) => b.id));

      const cells = [
        String(globalIndex),
        formatDateOnlyBR(loc.data_montagem),
        formatDateOnlyBR(loc.data_devolucao),
        loc.cliente?.nome || "Cliente Nao Informado",
        formatNumberBR(loc.valor_total),
        loc.endereco?.cidade || "-",
      ];

      let cx = margin;
      for (let colIdx = 0; colIdx < colWidths.length; colIdx++) {
        const w = colWidths[colIdx];
        const isToyCol = colIdx >= 6;
        const toy = isToyCol ? toyColumns[colIdx - 6] : null;
        const isRented = toy ? rentedIds.has(toy.id) : false;

        if (isRented) {
          // Bright yellow fill (#FFFF00) like the screenshot
          ops.push("1 1 0 rg");
          ops.push(
            `${cx.toFixed(2)} ${rBottomY.toFixed(2)} ${w.toFixed(
              2
            )} ${rowHeight.toFixed(2)} re f`
          );
        }

        // Border
        ops.push("0 0 0 RG 0.5 w");
        ops.push(
          `${cx.toFixed(2)} ${rBottomY.toFixed(2)} ${w.toFixed(
            2
          )} ${rowHeight.toFixed(2)} re S`
        );

        // Text for columns 0..5
        if (!isToyCol) {
          const rawText = cells[colIdx] || "";
          const fontSize = 8.5;
          const maxChars = Math.max(3, Math.floor((w - 8) / (fontSize * 0.5)));
          const txt = truncateTextToWidth(rawText, maxChars);

          // Right-align index (col 0) and valor (col 4)
          let textX = cx + 4;
          if (colIdx === 0 || colIdx === 4) {
            const approxWidth = txt.length * (fontSize * 0.5);
            textX = Math.max(cx + 3, cx + w - approxWidth - 4);
          }

          ops.push("0 0 0 rg");
          ops.push(
            `BT /F1 ${fontSize} Tf ${textX.toFixed(2)} ${(
              rBottomY + 6
            ).toFixed(2)} Td (${pdfEscapeWinAnsi(txt)}) Tj ET`
          );
        }

        cx += w;
      }

      currentTopY = rBottomY;
    });

    // Draw Total footer row on the last page
    if (pageIndex === pages.length - 1) {
      const fBottomY = currentTopY - headerHeight;
      let fx = margin;

      // Span cols 0..3 as "Total" label
      const labelSpanW =
        colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3];
      ops.push("0.95 0.95 0.95 rg");
      ops.push(
        `${fx.toFixed(2)} ${fBottomY.toFixed(2)} ${labelSpanW.toFixed(
          2
        )} ${headerHeight.toFixed(2)} re f`
      );
      ops.push("0 0 0 RG 0.6 w");
      ops.push(
        `${fx.toFixed(2)} ${fBottomY.toFixed(2)} ${labelSpanW.toFixed(
          2
        )} ${headerHeight.toFixed(2)} re S`
      );
      ops.push("0 0 0 rg");
      ops.push(
        `BT /F2 9 Tf ${(fx + 6).toFixed(2)} ${(fBottomY + 7).toFixed(
          2
        )} Td (${pdfEscapeWinAnsi(
          `TOTAL (${rows.length} locacoes)`
        )}) Tj ET`
      );
      fx += labelSpanW;

      // Valor Total cell (col 4) in yellow
      const valW = colWidths[4];
      ops.push("1 1 0 rg");
      ops.push(
        `${fx.toFixed(2)} ${fBottomY.toFixed(2)} ${valW.toFixed(
          2
        )} ${headerHeight.toFixed(2)} re f`
      );
      ops.push("0 0 0 RG 0.6 w");
      ops.push(
        `${fx.toFixed(2)} ${fBottomY.toFixed(2)} ${valW.toFixed(
          2
        )} ${headerHeight.toFixed(2)} re S`
      );
      const totalStr = formatNumberBR(totalValor);
      const approxValW = totalStr.length * 4.5;
      const valX = Math.max(fx + 3, fx + valW - approxValW - 4);
      ops.push("0 0 0 rg");
      ops.push(
        `BT /F2 8.5 Tf ${valX.toFixed(2)} ${(fBottomY + 7).toFixed(
          2
        )} Td (${pdfEscapeWinAnsi(totalStr)}) Tj ET`
      );
      fx += valW;

      // Empty cell under Cidade (col 5) and counts under each toy column
      const cidW = colWidths[5];
      ops.push("0.95 0.95 0.95 rg");
      ops.push(
        `${fx.toFixed(2)} ${fBottomY.toFixed(2)} ${cidW.toFixed(
          2
        )} ${headerHeight.toFixed(2)} re f`
      );
      ops.push("0 0 0 RG 0.6 w");
      ops.push(
        `${fx.toFixed(2)} ${fBottomY.toFixed(2)} ${cidW.toFixed(
          2
        )} ${headerHeight.toFixed(2)} re S`
      );
      fx += cidW;

      toyColumns.forEach((toy, tIdx) => {
        const tw = colWidths[6 + tIdx];
        const usageCount = rows.filter((r) =>
          r.brinquedos?.some((b) => b.id === toy.id)
        ).length;

        ops.push("0.92 0.92 0.92 rg");
        ops.push(
          `${fx.toFixed(2)} ${fBottomY.toFixed(2)} ${tw.toFixed(
            2
          )} ${headerHeight.toFixed(2)} re f`
        );
        ops.push("0 0 0 RG 0.6 w");
        ops.push(
          `${fx.toFixed(2)} ${fBottomY.toFixed(2)} ${tw.toFixed(
            2
          )} ${headerHeight.toFixed(2)} re S`
        );
        ops.push("0 0 0 rg");
        const countStr = `${usageCount}x`;
        ops.push(
          `BT /F2 8 Tf ${(fx + tw / 2 - 5).toFixed(2)} ${(
            fBottomY + 7
          ).toFixed(2)} Td (${countStr}) Tj ET`
        );
        fx += tw;
      });
    }

    pageStreams.push(ops.join("\n"));
  });

  // Assemble valid PDF 1.4 document
  // Object 1: Catalog
  // Object 2: Pages
  // Object 3: Font F1 (Helvetica)
  // Object 4: Font F2 (Helvetica-Bold)
  // Objects 5..: Page + Content pairs
  const objects: string[] = [];
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");

  const pageObjectIds: number[] = [];
  for (let i = 0; i < pageStreams.length; i++) {
    pageObjectIds.push(5 + i * 2);
  }

  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjectIds
      .map((id) => `${id} 0 R`)
      .join(" ")}] /Count ${pageStreams.length} >>\nendobj`
  );
  objects.push(
    "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj"
  );
  objects.push(
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj"
  );

  pageStreams.forEach((stream, i) => {
    const pageObjId = 5 + i * 2;
    const contentObjId = pageObjId + 1;
    objects.push(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj`
    );
    objects.push(
      `${contentObjId} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`
    );
  });

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj + "\n";
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${
    objects.length + 1
  } /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

export function LocacoesSpreadsheet({
  locacoes,
  brinquedos,
  onSelectLocacao,
}: LocacoesSpreadsheetProps) {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("proximas");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered non-cancelled rentals according to selected period & search
  const filteredLocacoes = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return locacoes
      .filter((loc) => {
        if (loc.cancelada) return false;

        const dMontagem = loc.data_montagem
          ? new Date(loc.data_montagem)
          : null;
        const dDevolucao = loc.data_devolucao
          ? new Date(loc.data_devolucao)
          : null;

        if (periodFilter === "proximas") {
          if (!dDevolucao || dDevolucao < hoje) return false;
        } else if (periodFilter === "fim_de_semana") {
          // Find upcoming (or current) Saturday and Sunday
          const dayOfWeek = hoje.getDay(); // 0 = Sun, 6 = Sat
          const saturday = new Date(hoje);
          if (dayOfWeek === 0) {
            // Today is Sunday: include yesterday (Sat) and today (Sun)
            saturday.setDate(hoje.getDate() - 1);
          } else {
            saturday.setDate(hoje.getDate() + (6 - dayOfWeek));
          }
          saturday.setHours(0, 0, 0, 0);

          const sundayEnd = new Date(saturday);
          sundayEnd.setDate(saturday.getDate() + 1);
          sundayEnd.setHours(23, 59, 59, 999);

          const start = dMontagem || dDevolucao;
          const end = dDevolucao || dMontagem;
          if (!start || !end) return false;
          if (start > sundayEnd || end < saturday) return false;
        } else if (periodFilter === "este_mes") {
          const month = hoje.getMonth();
          const year = hoje.getFullYear();
          const matchesMonth =
            (dMontagem &&
              dMontagem.getMonth() === month &&
              dMontagem.getFullYear() === year) ||
            (dDevolucao &&
              dDevolucao.getMonth() === month &&
              dDevolucao.getFullYear() === year);
          if (!matchesMonth) return false;
        } else if (periodFilter === "personalizado") {
          if (customStart) {
            const startLimit = new Date(`${customStart}T00:00:00`);
            if (dDevolucao && dDevolucao < startLimit) return false;
          }
          if (customEnd) {
            const endLimit = new Date(`${customEnd}T23:59:59`);
            if (dMontagem && dMontagem > endLimit) return false;
          }
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const nomeMatch = loc.cliente?.nome?.toLowerCase().includes(q);
          const cidadeMatch = loc.endereco?.cidade?.toLowerCase().includes(q);
          if (!nomeMatch && !cidadeMatch) return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(a.data_montagem).getTime() -
          new Date(b.data_montagem).getTime()
      );
  }, [locacoes, periodFilter, customStart, customEnd, searchQuery]);

  // Build ordered columns for each active toy unit (plus any toy referenced in the filtered rentals)
  const toyColumns = useMemo(() => {
    const map = new Map<number, Brinquedo>();
    brinquedos.forEach((b) => {
      if (b.ativo) map.set(b.id, b);
    });
    filteredLocacoes.forEach((loc) => {
      loc.brinquedos?.forEach((b) => {
        if (!map.has(b.id)) {
          map.set(b.id, b);
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => {
      const pA = TOY_ORDER_PRIORITY[a.tipo] ?? 99;
      const pB = TOY_ORDER_PRIORITY[b.tipo] ?? 99;
      if (pA !== pB) return pA - pB;
      return a.id - b.id;
    });
  }, [brinquedos, filteredLocacoes]);

  const totalValor = useMemo(() => {
    return filteredLocacoes.reduce((acc, loc) => {
      const v =
        typeof loc.valor_total === "string"
          ? parseFloat(loc.valor_total)
          : loc.valor_total;
      return acc + (isNaN(v) ? 0 : v);
    }, 0);
  }, [filteredLocacoes]);

  const handleDownloadPdf = () => {
    const blob = generateSpreadsheetPdfBlob(
      filteredLocacoes,
      toyColumns,
      totalValor
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const todayStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `planilha-locacoes-${todayStr}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  const handlePrintSpreadsheet = () => {
    // Classic spreadsheet HTML in a hidden iframe for crisp native printing
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const toyHeadersHtml = toyColumns
      .map(
        (t) =>
          `<th class="toy-header">${getToyShortName(t.tipo)}</th>`
      )
      .join("");

    const rowsHtml = filteredLocacoes
      .map((loc, idx) => {
        const rentedIds = new Set((loc.brinquedos || []).map((b) => b.id));
        const toyCells = toyColumns
          .map(
            (t) =>
              `<td class="${rentedIds.has(t.id) ? "rented-cell" : ""}"></td>`
          )
          .join("");

        return `
          <tr>
            <td class="idx-cell">${idx + 1}</td>
            <td>${formatDateOnlyBR(loc.data_montagem)}</td>
            <td>${formatDateOnlyBR(loc.data_devolucao)}</td>
            <td class="name-cell">${loc.cliente?.nome || "-"}</td>
            <td class="val-cell">${formatNumberBR(loc.valor_total)}</td>
            <td>${loc.endereco?.cidade || "-"}</td>
            ${toyCells}
          </tr>
        `;
      })
      .join("");

    const toyTotalsHtml = toyColumns
      .map((t) => {
        const count = filteredLocacoes.filter((r) =>
          r.brinquedos?.some((b) => b.id === t.id)
        ).length;
        return `<td class="total-toy-cell">${count}x</td>`;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Planilha de Locações</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: Calibri, Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #000000;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #000000;
            padding: 5px 7px;
            text-align: left;
            white-space: nowrap;
          }
          th.main-header {
            background-color: #ffff00 !important;
            font-weight: 700;
          }
          th.toy-header {
            background-color: #d9d9d9 !important;
            font-weight: 700;
            text-align: center;
          }
          td.idx-cell {
            text-align: right;
            width: 28px;
          }
          td.val-cell {
            text-align: right;
            font-variant-numeric: tabular-nums;
          }
          td.rented-cell {
            background-color: #ffff00 !important;
          }
          tfoot td {
            font-weight: 700;
            background-color: #f2f2f2 !important;
          }
          tfoot td.total-val {
            background-color: #ffff00 !important;
            text-align: right;
          }
          tfoot td.total-toy-cell {
            text-align: center;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th></th>
              <th class="main-header">Montagem</th>
              <th class="main-header">Desmontagem</th>
              <th class="main-header">Nome</th>
              <th class="main-header">Valor</th>
              <th class="main-header">Cidade</th>
              ${toyHeadersHtml}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4">TOTAL (${filteredLocacoes.length} locações)</td>
              <td class="total-val">${formatNumberBR(totalValor)}</td>
              <td></td>
              ${toyTotalsHtml}
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1500);
      }, 250);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Filter & Export Controls Bar */}
      <Card className="p-4 sm:p-5 border-border/70 bg-card/80 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Period Quick Filters */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-indigo-500" /> Filtrar Período
              da Planilha
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: "proximas", label: "Próximas" },
                  { id: "fim_de_semana", label: "Este Fim de Semana" },
                  { id: "este_mes", label: "Este Mês" },
                  { id: "todas", label: "Todas Ativas" },
                  { id: "personalizado", label: "Período Personalizado" },
                ] as { id: PeriodFilter; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPeriodFilter(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    periodFilter === item.id
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Export Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative min-w-[210px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar cliente ou cidade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-10 text-xs rounded-xl"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrintSpreadsheet}
                disabled={filteredLocacoes.length === 0}
                className="rounded-xl h-10 px-3.5 text-xs font-bold flex-1 sm:flex-initial"
                title="Imprimir no formato clássico de planilha"
              >
                <Printer className="h-4 w-4 mr-1.5" />
                Imprimir
              </Button>
              <Button
                type="button"
                variant="indigo"
                onClick={handleDownloadPdf}
                disabled={filteredLocacoes.length === 0}
                className="rounded-xl h-10 px-4 text-xs font-bold shadow-md flex-1 sm:flex-initial"
              >
                <FileDown className="h-4 w-4 mr-1.5" />
                Baixar PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {periodFilter === "personalizado" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/60 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5 text-indigo-500" /> Data
                Inicial
              </label>
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-10 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5 text-rose-500" /> Data
                Final
              </label>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-10 rounded-xl text-xs"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Modern System-Themed Spreadsheet Table */}
      {filteredLocacoes.length > 0 ? (
        <Card className="overflow-hidden border-border/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border/80">
                  <th className="py-3 px-3 text-right font-bold text-muted-foreground bg-muted/50 border-r border-border/60 w-10">
                    #
                  </th>
                  <th className="py-3 px-3.5 text-left font-bold text-indigo-950 dark:text-indigo-100 bg-indigo-500/15 dark:bg-indigo-500/20 border-r border-border/60 whitespace-nowrap">
                    Montagem
                  </th>
                  <th className="py-3 px-3.5 text-left font-bold text-indigo-950 dark:text-indigo-100 bg-indigo-500/15 dark:bg-indigo-500/20 border-r border-border/60 whitespace-nowrap">
                    Desmontagem
                  </th>
                  <th className="py-3 px-4 text-left font-bold text-indigo-950 dark:text-indigo-100 bg-indigo-500/15 dark:bg-indigo-500/20 border-r border-border/60 min-w-[170px]">
                    Nome
                  </th>
                  <th className="py-3 px-3.5 text-right font-bold text-indigo-950 dark:text-indigo-100 bg-indigo-500/15 dark:bg-indigo-500/20 border-r border-border/60 whitespace-nowrap">
                    Valor
                  </th>
                  <th className="py-3 px-3.5 text-left font-bold text-indigo-950 dark:text-indigo-100 bg-indigo-500/15 dark:bg-indigo-500/20 border-r border-border/60 whitespace-nowrap">
                    Cidade
                  </th>
                  {toyColumns.map((toy) => (
                    <th
                      key={toy.id}
                      title={`${formatTitleCase(
                        toy.tipo.replaceAll("-", " ")
                      )} (Patrimônio #${toy.id})`}
                      className="py-3 px-2.5 text-center font-bold text-foreground bg-muted/80 dark:bg-muted/60 border-r last:border-r-0 border-border/60 whitespace-nowrap min-w-[86px]"
                    >
                      <div className="flex flex-col items-center leading-tight">
                        <span>{getToyShortName(toy.tipo)}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {filteredLocacoes.map((loc, idx) => {
                  const rentedIds = new Set(
                    (loc.brinquedos || []).map((b) => b.id)
                  );

                  return (
                    <tr
                      key={loc.id}
                      onClick={() => onSelectLocacao?.(loc)}
                      className={`group transition-colors ${
                        onSelectLocacao
                          ? "cursor-pointer hover:bg-muted/40"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-right font-mono text-xs text-muted-foreground border-r border-border/60 bg-muted/20">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-xs sm:text-sm text-foreground border-r border-border/60 whitespace-nowrap">
                        {formatDateOnlyBR(loc.data_montagem)}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-xs sm:text-sm text-foreground border-r border-border/60 whitespace-nowrap">
                        {formatDateOnlyBR(loc.data_devolucao)}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-foreground border-r border-border/60 whitespace-nowrap group-hover:text-indigo-500 transition-colors">
                        {loc.cliente?.nome || "Cliente Não Informado"}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 border-r border-border/60 whitespace-nowrap">
                        {formatNumberBR(loc.valor_total)}
                      </td>
                      <td className="py-2.5 px-3.5 text-foreground border-r border-border/60 whitespace-nowrap">
                        {loc.endereco?.cidade ? (
                          loc.endereco.cidade
                        ) : (
                          <span className="text-xs text-amber-500 italic">
                            A definir
                          </span>
                        )}
                      </td>
                      {toyColumns.map((toy) => {
                        const isRented = rentedIds.has(toy.id);
                        return (
                          <td
                            key={toy.id}
                            className={`p-1.5 text-center border-r last:border-r-0 border-border/60 transition-colors ${
                              isRented
                                ? "bg-indigo-500/20 dark:bg-indigo-500/30"
                                : ""
                            }`}
                          >
                            {isRented && (
                              <div className="mx-auto flex h-6 w-full items-center justify-center rounded-md bg-indigo-600 text-white shadow-sm">
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr className="border-t-2 border-border bg-muted/60 font-bold">
                  <td
                    colSpan={4}
                    className="py-3 px-4 text-left text-xs sm:text-sm uppercase tracking-wider text-foreground border-r border-border/60"
                  >
                    Total ({filteredLocacoes.length}{" "}
                    {filteredLocacoes.length === 1 ? "locação" : "locações"})
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-r border-border/60 whitespace-nowrap">
                    {formatCurrency(totalValor)}
                  </td>
                  <td className="py-3 px-3.5 border-r border-border/60"></td>
                  {toyColumns.map((toy) => {
                    const usageCount = filteredLocacoes.filter((r) =>
                      r.brinquedos?.some((b) => b.id === toy.id)
                    ).length;
                    return (
                      <td
                        key={toy.id}
                        className="py-3 px-2 text-center font-mono text-xs text-muted-foreground border-r last:border-r-0 border-border/60"
                      >
                        <Badge
                          variant={usageCount > 0 ? "default" : "secondary"}
                          className="text-[10px] px-2 py-0"
                        >
                          {usageCount}x
                        </Badge>
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-12 text-center border-dashed">
          <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-foreground">
            Nenhuma locação neste período
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Altere o filtro de período acima para visualizar e exportar outras
            locações na planilha.
          </p>
        </Card>
      )}
    </div>
  );
}
