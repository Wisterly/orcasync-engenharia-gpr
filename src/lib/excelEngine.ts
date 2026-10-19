import ExcelJS from 'exceljs';
import { BudgetItem, ContractSheet, MatchingResult, StageGroup } from '@/types/budget';

// Helper to convert column index (1-based) to letter (A, B, C... Z, AA, etc.)
export function colToLetter(colIndex: number): string {
  let temp: number;
  let letter = '';
  while (colIndex > 0) {
    temp = (colIndex - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colIndex = (colIndex - temp - 1) / 26;
  }
  return letter;
}

// Helper to convert letter to column index
export function letterToCol(letter: string): number {
  let column = 0;
  const upper = letter.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    column += (upper.charCodeAt(i) - 64) * Math.pow(26, upper.length - i - 1);
  }
  return column;
}

export interface DetectedColumns {
  itemCol: number;
  codeCol: number;
  sourceCol: number;
  descCol: number;
  unitCol: number;
  qtyCol: number;
  unitPriceCol: number;
  unitPriceBdiCol: number;
  totalCol: number;
  headerRow: number;
}

export function detectColumns(worksheet: ExcelJS.Worksheet): DetectedColumns | null {
  let detected: DetectedColumns | null = null;

  // Scan the first 15 rows to find header
  for (let r = 1; r <= Math.min(15, worksheet.rowCount); r++) {
    const row = worksheet.getRow(r);
    let itemCol = 0;
    let codeCol = 0;
    let sourceCol = 0;
    let descCol = 0;
    let unitCol = 0;
    let qtyCol = 0;
    let unitPriceCol = 0;
    let unitPriceBdiCol = 0;
    let totalCol = 0;

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const val = (cell.text || cell.value?.toString() || '').toLowerCase().trim();

      if (/(item|n[ºo]|ordem|hierarquia)/i.test(val) && !itemCol) itemCol = colNumber;
      else if (/(c[oó]digo|cod|item\s*sinapi)/i.test(val) && !codeCol) codeCol = colNumber;
      else if (/(fonte|base|banco)/i.test(val) && !sourceCol) sourceCol = colNumber;
      else if (/(discrimina[cç][aã]o|descri[cç][aã]o|servi[cç]o|composi[cç][aã]o)/i.test(val) && !descCol) descCol = colNumber;
      else if (/(unid|unidade|un)/i.test(val) && !unitCol) unitCol = colNumber;
      else if (/(quant|qtd|quantitativo)/i.test(val) && !qtyCol) qtyCol = colNumber;
      else if (/(unit[aá]rio\s*c\/\s*bdi|pre[cç]o\s*unit.*bdi)/i.test(val) && !unitPriceBdiCol) unitPriceBdiCol = colNumber;
      else if (/(unit[aá]rio|pre[cç]o\s*unit|valor\s*unit)/i.test(val) && !unitPriceCol) unitPriceCol = colNumber;
      else if (/(total|pre[cç]o\s*total|valor\s*total|subtotal)/i.test(val) && !totalCol) totalCol = colNumber;
    });

    if (descCol && (qtyCol || totalCol || unitPriceCol)) {
      detected = {
        itemCol: itemCol || 1,
        codeCol: codeCol || 2,
        sourceCol: sourceCol || 3,
        descCol,
        unitCol: unitCol || (descCol + 1),
        qtyCol: qtyCol || (unitCol ? unitCol + 1 : descCol + 2),
        unitPriceCol: unitPriceCol || (qtyCol ? qtyCol + 1 : descCol + 3),
        unitPriceBdiCol: unitPriceBdiCol || (unitPriceCol ? unitPriceCol + 1 : 0),
        totalCol: totalCol || (unitPriceBdiCol ? unitPriceBdiCol + 1 : unitPriceCol + 1),
        headerRow: r,
      };
      break;
    }
  }

  return detected;
}

export function extractNumericValue(cell: ExcelJS.Cell): number {
  if (cell.value === null || cell.value === undefined) return 0;
  if (typeof cell.value === 'number') return cell.value;
  if (typeof cell.value === 'object' && 'result' in cell.value) {
    const res = (cell.value as { result?: unknown }).result;
    if (typeof res === 'number') return res;
    if (typeof res === 'string') {
      const parsed = parseFloat(res.replace(/[^\d,-]/g, '').replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    }
  }
  const text = cell.text || cell.value.toString();
  const cleaned = text.replace(/R\$/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Parse an uploaded Excel spreadsheet buffer into a ContractSheet
export async function parseExcelBudget(
  buffer: ArrayBuffer,
  fileName: string,
  isTargetContract: boolean = false
): Promise<ContractSheet> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('A planilha selecionada não possui abas visíveis.');
  }

  const columns = detectColumns(worksheet) || {
    itemCol: 1,
    codeCol: 2,
    sourceCol: 3,
    descCol: 4,
    unitCol: 5,
    qtyCol: 6,
    unitPriceCol: 7,
    unitPriceBdiCol: 8,
    totalCol: 9,
    headerRow: 1,
  };

  const items: BudgetItem[] = [];
  const stages: StageGroup[] = [];
  let currentStage: StageGroup | null = null;

  for (let r = columns.headerRow + 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    const descCell = row.getCell(columns.descCol);
    const descText = (descCell.text || descCell.value?.toString() || '').trim();

    if (!descText) continue;

    const itemCell = row.getCell(columns.itemCol);
    const itemCode = (itemCell.text || itemCell.value?.toString() || `${r}`).trim();
    const codeCell = row.getCell(columns.codeCol);
    const codeText = (codeCell.text || codeCell.value?.toString() || '').trim();
    const sourceCell = row.getCell(columns.sourceCol);
    const sourceText = (sourceCell.text || sourceCell.value?.toString() || '').trim();
    const unitCell = row.getCell(columns.unitCol);
    const unitText = (unitCell.text || unitCell.value?.toString() || '').trim();

    const qty = extractNumericValue(row.getCell(columns.qtyCol));
    const unitPriceWithoutBDI = extractNumericValue(row.getCell(columns.unitPriceCol));
    const unitPriceWithBDI = columns.unitPriceBdiCol
      ? extractNumericValue(row.getCell(columns.unitPriceBdiCol))
      : unitPriceWithoutBDI;
    const totalPrice = extractNumericValue(row.getCell(columns.totalCol));

    // Determine if it is a stage header (e.g. "1.0", "2.0", "3.0" or no unit/no quantity with bold font)
    const isStagePattern = /^(\d+)(\.0+)?$/i.test(itemCode) || (unitText === '' && qty === 0 && totalPrice >= 0 && descText.length < 100);
    const isStageHeader = isStagePattern && (itemCode.endsWith('.0') || !itemCode.includes('.') || unitText === '');

    const totalColLetter = colToLetter(columns.totalCol);
    const qtyColLetter = colToLetter(columns.qtyCol);
    const unitPriceColLetter = colToLetter(columns.unitPriceCol);
    const unitPriceBdiColLetter = columns.unitPriceBdiCol ? colToLetter(columns.unitPriceBdiCol) : unitPriceColLetter;

    const budgetItem: BudgetItem = {
      id: `row-${r}-${Math.random().toString(36).slice(2, 7)}`,
      rowNumber: r,
      itemCode,
      stageLevel: itemCode.split('.').filter(Boolean).length || 1,
      isStageHeader,
      source: sourceText || 'SINAPI',
      code: codeText,
      description: descText,
      unit: unitText,
      quantity: qty,
      unitPriceWithoutBDI,
      unitPriceWithBDI,
      totalPrice: totalPrice || (qty * unitPriceWithBDI),
      bdiPercentage: unitPriceWithoutBDI > 0 && unitPriceWithBDI > unitPriceWithoutBDI
        ? Math.round(((unitPriceWithBDI / unitPriceWithoutBDI) - 1) * 10000) / 100
        : 25.5,
      cellRefs: {
        qtyCell: `${qtyColLetter}${r}`,
        unitPriceCell: `${unitPriceColLetter}${r}`,
        unitPriceBdiCell: `${unitPriceBdiColLetter}${r}`,
        totalCell: `${totalColLetter}${r}`,
      },
    };

    if (isStageHeader) {
      if (currentStage) {
        stages.push(currentStage);
      }
      currentStage = {
        itemCode,
        title: descText,
        rowNumber: r,
        totalCell: `${totalColLetter}${r}`,
        subitemRowNumbers: [],
        subitemTotalCells: [],
        subtotal: totalPrice,
      };
    } else {
      if (currentStage) {
        currentStage.subitemRowNumbers.push(r);
        currentStage.subitemTotalCells.push(`${totalColLetter}${r}`);
      }
    }

    items.push(budgetItem);
  }

  if (currentStage) {
    stages.push(currentStage);
  }

  const itemsWithQuantity = items.filter(i => !i.isStageHeader && i.quantity > 0);
  const totalValueWithBDI = itemsWithQuantity.reduce((acc, curr) => acc + (curr.totalPrice || curr.quantity * curr.unitPriceWithBDI), 0);
  const totalValueWithoutBDI = itemsWithQuantity.reduce((acc, curr) => acc + (curr.quantity * curr.unitPriceWithoutBDI), 0);

  return {
    id: `contract-${Date.now()}`,
    title: fileName.replace(/\.xlsx$/i, ''),
    company: isTargetContract ? 'Nova Construtora Contratada' : 'Contrato Anterior',
    contractNumber: `CT-${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
    bdiPercentage: 25.5,
    items,
    stages,
    totalValueWithBDI,
    totalValueWithoutBDI,
    itemsWithQuantityCount: itemsWithQuantity.length,
    fileName,
    rawWorkbookBuffer: buffer,
    createdAt: new Date().toISOString(),
  };
}

// Generate the fully functional Excel (.xlsx) file with LIVE FORMULAS
export async function generateAutomatedExcelFile(
  targetContract: ContractSheet,
  matches: MatchingResult[],
  options: {
    preserveLiveFormulas: boolean;
  }
): Promise<Blob> {
  let workbook = new ExcelJS.Workbook();
  let worksheet: ExcelJS.Worksheet;

  // CRITICAL REQUIREMENT 1: Enable full calculation on Excel load
  workbook.calcProperties.fullCalcOnLoad = true;

  // Map of targetItemId -> match
  const matchMap = new Map<string, MatchingResult>();
  matches.forEach(m => {
    if (m.targetItemId) {
      matchMap.set(m.targetItemId, m);
    }
  });

  // If we have the raw workbook buffer from the target template, load it to preserve all formatting!
  if (targetContract.rawWorkbookBuffer) {
    await workbook.xlsx.load(targetContract.rawWorkbookBuffer);
    worksheet = workbook.worksheets[0];
    workbook.calcProperties.fullCalcOnLoad = true;
  } else {
    // Build a high-end luxury engineering spreadsheet from scratch with full styling and formulas
    worksheet = workbook.addWorksheet('Orçamento Compatibilizado', {
      views: [{ showGridLines: true }],
      pageSetup: { orientation: 'landscape', paperSize: 9 },
    });

    // Setup columns
    worksheet.columns = [
      { header: 'ITEM', key: 'item', width: 9 },
      { header: 'CÓDIGO', key: 'code', width: 13 },
      { header: 'FONTE', key: 'source', width: 10 },
      { header: 'DESCRIÇÃO DOS SERVIÇOS', key: 'desc', width: 55 },
      { header: 'UNID.', key: 'unit', width: 8 },
      { header: 'QUANT.', key: 'qty', width: 13 },
      { header: 'UNIT. S/ BDI (R$)', key: 'priceNoBdi', width: 16 },
      { header: 'UNIT. C/ BDI (R$)', key: 'priceWithBdi', width: 16 },
      { header: 'TOTAL (R$)', key: 'total', width: 18 },
    ];

    // Luxury Header Banner
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `ORÇASYNC | ENGENHARIA GPR — PLANILHA ORÇAMENTÁRIA COMPATIBILIZADA`;
    titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF121316' },
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    // Subtitle Info Row
    worksheet.mergeCells('A2:I2');
    const subCell = worksheet.getCell('A2');
    subCell.value = `CONTRATO BASE: ${targetContract.title.toUpperCase()} | EMPRESA: ${targetContract.company.toUpperCase()} | BDI APLICADO: ${targetContract.bdiPercentage.toFixed(2)}% | DATA BASE: ${new Date().toLocaleDateString('pt-BR')}`;
    subCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FFD4AF37' } };
    subCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A1C23' },
    };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 20;

    // Table Column Headers (Row 4)
    const headerRow = worksheet.getRow(4);
    headerRow.values = [
      'ITEM',
      'CÓDIGO',
      'FONTE',
      'DESCRIÇÃO DA COMPOSIÇÃO',
      'UNID.',
      'QUANTIDADE',
      'UNIT. S/ BDI',
      'UNIT. C/ BDI',
      'PREÇO TOTAL (R$)',
    ];
    headerRow.height = 24;

    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF242731' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FFD4AF37' } },
        bottom: { style: 'medium', color: { argb: 'FFD4AF37' } },
        left: { style: 'thin', color: { argb: 'FF3E4352' } },
        right: { style: 'thin', color: { argb: 'FF3E4352' } },
      };
    });

    let currentRow = 5;
    const stageHeaderRows: number[] = [];
    const stageSubitemMap = new Map<number, number[]>();
    let currentStageRow = 0;

    // Populate Items
    for (const item of targetContract.items) {
      const row = worksheet.getRow(currentRow);

      if (item.isStageHeader) {
        currentStageRow = currentRow;
        stageHeaderRows.push(currentStageRow);
        stageSubitemMap.set(currentStageRow, []);

        row.getCell(1).value = item.itemCode;
        row.getCell(4).value = item.description.toUpperCase();
        row.height = 22;

        // Stage Header Style
        for (let col = 1; col <= 9; col++) {
          const cell = row.getCell(col);
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFD700' } }; // Gold
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1C1F28' },
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD4AF37' } },
            bottom: { style: 'thin', color: { argb: 'FFD4AF37' } },
          };
        }
        row.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' };
      } else {
        // Subitem of service
        if (currentStageRow > 0) {
          stageSubitemMap.get(currentStageRow)?.push(currentRow);
        }

        const match = matchMap.get(item.id);
        const finalQuantity = match ? match.adjustedQuantity : 0;
        const unitPriceWithoutBDI = item.unitPriceWithoutBDI;
        const bdiMultiplier = 1 + targetContract.bdiPercentage / 100;
        const unitPriceWithBDI = item.unitPriceWithBDI || Math.round(unitPriceWithoutBDI * bdiMultiplier * 100) / 100;
        const calculatedTotal = Math.round(finalQuantity * unitPriceWithBDI * 100) / 100;

        row.getCell(1).value = item.itemCode;
        row.getCell(2).value = item.code || '';
        row.getCell(3).value = item.source || 'SINAPI';
        row.getCell(4).value = item.description;
        row.getCell(5).value = item.unit;

        // CRITICAL REQUIREMENT 2: Numeric Quantity & Live Formulas
        // Column F is Quantity (col 6)
        row.getCell(6).value = finalQuantity;
        row.getCell(6).numFmt = '#,##0.00';

        // Column G is Unit Price s/ BDI (col 7)
        row.getCell(7).value = unitPriceWithoutBDI;
        row.getCell(7).numFmt = 'R$ #,##0.00';

        // Column H is Unit Price c/ BDI (col 8)
        if (options.preserveLiveFormulas) {
          row.getCell(8).value = {
            formula: `ROUND(G${currentRow}*${bdiMultiplier.toFixed(4)}, 2)`,
            result: unitPriceWithBDI,
          };
        } else {
          row.getCell(8).value = unitPriceWithBDI;
        }
        row.getCell(8).numFmt = 'R$ #,##0.00';

        // Column I is Total Price (col 9): Formula = Qtd * UnitPriceWithBDI
        if (options.preserveLiveFormulas) {
          row.getCell(9).value = {
            formula: `ROUND(F${currentRow}*H${currentRow}, 2)`,
            result: calculatedTotal,
          };
        } else {
          row.getCell(9).value = calculatedTotal;
        }
        row.getCell(9).numFmt = 'R$ #,##0.00';

        // Styling subitem rows
        const isMatched = finalQuantity > 0;
        row.height = 20;

        for (let col = 1; col <= 9; col++) {
          const cell = row.getCell(col);
          cell.font = {
            name: 'Arial',
            size: 9,
            color: isMatched ? { argb: 'FFFFFFFF' } : { argb: 'FFAAAAAA' },
            bold: isMatched && col === 9,
          };
          if (isMatched) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF151821' }, // Subtle highlight for migrated active items
            };
          }
          cell.border = {
            bottom: { style: 'thin', color: { argb: 'FF2B2F3B' } },
            right: { style: 'thin', color: { argb: 'FF2B2F3B' } },
          };
        }

        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' };
        row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' };
        row.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };
        row.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };
        row.getCell(9).alignment = { vertical: 'middle', horizontal: 'right' };
      }

      currentRow++;
    }

    // CRITICAL REQUIREMENT 3: Formulas of SUM on Stage Headers
    stageHeaderRows.forEach(stageRow => {
      const subitems = stageSubitemMap.get(stageRow) || [];
      const stageTotalCell = worksheet.getRow(stageRow).getCell(9);

      if (subitems.length > 0) {
        const firstRow = subitems[0];
        const lastRow = subitems[subitems.length - 1];

        if (options.preserveLiveFormulas) {
          stageTotalCell.value = {
            formula: `SUM(I${firstRow}:I${lastRow})`,
            result: subitems.reduce((sum, r) => {
              const cell = worksheet.getRow(r).getCell(9);
              return sum + extractNumericValue(cell);
            }, 0),
          };
        }
      }
      stageTotalCell.numFmt = 'R$ #,##0.00';
      stageTotalCell.alignment = { vertical: 'middle', horizontal: 'right' };
    });

    // Blank separator row
    currentRow++;

    // CRITICAL REQUIREMENT 4: Summary and Grand Total in Footer with Live Formulas
    const summaryStartRow = currentRow;

    // Subtotal Row
    const subtotalRow = worksheet.getRow(summaryStartRow);
    worksheet.mergeCells(`A${summaryStartRow}:H${summaryStartRow}`);
    subtotalRow.getCell(1).value = 'SUBTOTAL DAS ETAPAS DO ORÇAMENTO (R$)';
    subtotalRow.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    subtotalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'right' };

    const stageCellsList = stageHeaderRows.map(r => `I${r}`).join(',');
    const stageSumFormula = stageCellsList ? `SUM(${stageCellsList})` : `SUM(I5:I${summaryStartRow - 2})`;

    subtotalRow.getCell(9).value = {
      formula: stageSumFormula,
      result: stageHeaderRows.reduce((sum, r) => sum + extractNumericValue(worksheet.getRow(r).getCell(9)), 0),
    };
    subtotalRow.getCell(9).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    subtotalRow.getCell(9).numFmt = 'R$ #,##0.00';
    subtotalRow.getCell(9).alignment = { vertical: 'middle', horizontal: 'right' };
    subtotalRow.height = 24;

    for (let c = 1; c <= 9; c++) {
      subtotalRow.getCell(c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1C1F28' },
      };
      subtotalRow.getCell(c).border = {
        top: { style: 'thin', color: { argb: 'FFD4AF37' } },
        bottom: { style: 'thin', color: { argb: 'FF3E4352' } },
      };
    }

    // BDI Indicator Row
    const bdiRow = worksheet.getRow(summaryStartRow + 1);
    worksheet.mergeCells(`A${summaryStartRow + 1}:H${summaryStartRow + 1}`);
    bdiRow.getCell(1).value = `TAXA DE B.D.I. ADOTADA (${targetContract.bdiPercentage.toFixed(2)}%)`;
    bdiRow.getCell(1).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFD4AF37' } };
    bdiRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'right' };
    bdiRow.getCell(9).value = `${targetContract.bdiPercentage.toFixed(2)}%`;
    bdiRow.getCell(9).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFD4AF37' } };
    bdiRow.getCell(9).alignment = { vertical: 'middle', horizontal: 'right' };
    bdiRow.height = 20;

    // GRAND TOTAL ROW (TOTAL GERAL)
    const grandTotalRow = worksheet.getRow(summaryStartRow + 2);
    worksheet.mergeCells(`A${summaryStartRow + 2}:H${summaryStartRow + 2}`);
    grandTotalRow.getCell(1).value = 'VALOR TOTAL GERAL DO NOVO CONTRATO COM BDI (R$)';
    grandTotalRow.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    grandTotalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'right' };

    grandTotalRow.getCell(9).value = {
      formula: `I${summaryStartRow}`,
      result: extractNumericValue(subtotalRow.getCell(9)),
    };
    grandTotalRow.getCell(9).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF10B981' } }; // Emerald green
    grandTotalRow.getCell(9).numFmt = 'R$ #,##0.00';
    grandTotalRow.getCell(9).alignment = { vertical: 'middle', horizontal: 'right' };
    grandTotalRow.height = 28;

    for (let c = 1; c <= 9; c++) {
      grandTotalRow.getCell(c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0D1117' },
      };
      grandTotalRow.getCell(c).border = {
        top: { style: 'medium', color: { argb: 'FFD4AF37' } },
        bottom: { style: 'double', color: { argb: 'FFD4AF37' } },
      };
    }
  }

  // Generate buffer and return as Blob
  const outputBuffer = await workbook.xlsx.writeBuffer();
  return new Blob([outputBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
