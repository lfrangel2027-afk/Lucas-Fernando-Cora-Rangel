import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StockItem, ItemCoverageAnalysis, CoverageBucketId } from '../types';

interface PDFExportOptions {
  cdName?: string;
  gestorName?: string;
}

/**
 * Generates and downloads the weekly Procurement / Insumos Coverage Minutes in PDF.
 */
export const exportarAtaCoberturaPDF = (
  coverageAnalyses: ItemCoverageAnalysis[],
  coverageBucketsCount: Record<CoverageBucketId, number>,
  options: PDFExportOptions = {}
) => {
  const cdName = options.cdName || 'Centro de Distribuição VIX1';
  const gestorName = options.gestorName || 'Gestão de Almoxarifado';
  const today = new Date().toLocaleDateString('pt-BR');
  const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Landscape A4 for wide table layout
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Amber accent line
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 27, pageWidth, 1.5, 'F');

  // Title & Subtitles
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ATA SEMANAL DE COBERTURA DE ESTOQUE — PROCUREMENT & INSUMOS', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`${cdName} · Emissão: ${today} às ${nowTime} · Responsável: ${gestorName}`, 14, 18);
  doc.text('Previsão de atendimento e cálculo de dias de cobertura com base no consumo médio diário.', 14, 23);

  // Executive Summary KPI Badges Row (y: 34 to 48)
  const bucketsDef = [
    { label: '0 a 3 DIAS (CRÍTICO)', count: coverageBucketsCount['0_a_3'] || 0, bg: [254, 226, 226], text: [185, 28, 28] }, // Red
    { label: '3,1 a 5 DIAS (ALERTA)', count: coverageBucketsCount['3_1_a_5'] || 0, bg: [255, 237, 213], text: [194, 65, 12] }, // Orange
    { label: '5,1 a 14 DIAS (ATENÇÃO)', count: coverageBucketsCount['5_1_a_14'] || 0, bg: [254, 243, 199], text: [180, 83, 9] }, // Amber
    { label: '14,1 a 21 DIAS (ESTÁVEL)', count: coverageBucketsCount['14_1_a_21'] || 0, bg: [219, 234, 254], text: [29, 78, 216] }, // Blue
    { label: 'ACIMA DE 21,1 DIAS', count: coverageBucketsCount['acima_21_1'] || 0, bg: [209, 250, 229], text: [4, 120, 87] } // Emerald
  ];

  const badgeWidth = (pageWidth - 28 - (bucketsDef.length - 1) * 3) / bucketsDef.length;
  let startX = 14;
  const startY = 32;

  bucketsDef.forEach(b => {
    doc.setFillColor(b.bg[0], b.bg[1], b.bg[2]);
    doc.roundedRect(startX, startY, badgeWidth, 12, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(b.text[0], b.text[1], b.text[2]);
    doc.text(b.label, startX + badgeWidth / 2, startY + 4.5, { align: 'center' });

    doc.setFontSize(11);
    doc.text(`${b.count} itens`, startX + badgeWidth / 2, startY + 9.5, { align: 'center' });

    startX += badgeWidth + 3;
  });

  // Table Data Preparation
  const tableData = coverageAnalyses.map((ca, idx) => {
    const diasStr = ca.diasCobertura === 999 ? 'Sem consumo' : `${ca.diasCobertura} dias`;
    const mixStr = ca.usoPercentual > 0 ? `${ca.usoPercentual}%` : '-';
    return [
      idx + 1,
      ca.nomeItem,
      ca.codigo || '-',
      ca.descricao || ca.nomeItem,
      `${ca.contagemEstoque} ${ca.unidadeContagem}s`,
      ca.estoqueTotalPecas.toLocaleString('pt-BR'),
      ca.mediaUsoDiario > 0 ? `${ca.mediaUsoDiario.toLocaleString('pt-BR')} un/dia` : '-',
      mixStr,
      diasStr,
      ca.bucketLabel
    ];
  });

  autoTable(doc, {
    startY: 48,
    head: [[
      '#',
      'Item',
      'Código',
      'Descrição do Material',
      'Est. Físico',
      'Estoque Total (Un)',
      'Consumo Médio/Dia',
      'Uso %',
      'Dias Cobertura',
      'Classificação Insumos'
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 1.8,
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 22 },
      2: { fontStyle: 'normal', cellWidth: 28 },
      3: { cellWidth: 'auto' },
      4: { halign: 'center', cellWidth: 24 },
      5: { halign: 'right', fontStyle: 'bold', cellWidth: 26 },
      6: { halign: 'right', cellWidth: 26 },
      7: { halign: 'center', cellWidth: 16 },
      8: { halign: 'center', fontStyle: 'bold', cellWidth: 24 },
      9: { halign: 'center', fontStyle: 'bold', cellWidth: 32 }
    },
    didParseCell: (data) => {
      // Colorize Days & Classification cells
      if (data.section === 'body') {
        const item = coverageAnalyses[data.row.index];
        if (!item) return;

        if (data.column.index === 8 || data.column.index === 9) {
          if (item.bucket === '0_a_3') {
            data.cell.styles.fillColor = [254, 226, 226];
            data.cell.styles.textColor = [185, 28, 28];
          } else if (item.bucket === '3_1_a_5') {
            data.cell.styles.fillColor = [255, 237, 213];
            data.cell.styles.textColor = [194, 65, 12];
          } else if (item.bucket === '5_1_a_14') {
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.textColor = [180, 83, 9];
          } else if (item.bucket === '14_1_a_21') {
            data.cell.styles.fillColor = [219, 234, 254];
            data.cell.styles.textColor = [29, 78, 216];
          } else if (item.bucket === 'acima_21_1') {
            data.cell.styles.fillColor = [209, 250, 229];
            data.cell.styles.textColor = [4, 120, 87];
          }
        }
      }
    },
    didDrawPage: (data) => {
      // Footer on every page
      const str = `Página ${data.pageNumber} de ${doc.getNumberOfPages()}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Controle de Estoque & Expedição · Ata Semanal de Insumos · Documento Interno e Confidencial',
        14,
        pageHeight - 8
      );
      doc.text(str, pageWidth - 14, pageHeight - 8, { align: 'right' });
    }
  });

  const dateFile = new Date().toISOString().slice(0, 10);
  doc.save(`ata_cobertura_insumos_${dateFile}.pdf`);
};

/**
 * Generates and downloads the full General Inventory Report in PDF format.
 */
export const exportarInventarioPDF = (
  items: StockItem[],
  kpis: {
    totalItens: number;
    totalContagem: number;
    totalEstoquePecas: number;
    itensZerados: number;
    itensBaixos: number;
  },
  options: PDFExportOptions = {}
) => {
  const cdName = options.cdName || 'Centro de Distribuição VIX1';
  const gestorName = options.gestorName || 'Gestão de Almoxarifado';
  const today = new Date().toLocaleDateString('pt-BR');
  const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Landscape A4
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Accent bar
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 25, pageWidth, 1.5, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('RELATÓRIO GERAL DE INVENTÁRIO FÍSICO DE ESTOQUE', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`${cdName} · Data: ${today} às ${nowTime} · Responsável: ${gestorName}`, 14, 17);
  doc.text('Contagem física de caixas, polibags, etiquetas e materiais computados no almoxarifado.', 14, 22);

  // Summary Metrics Box
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(14, 30, pageWidth - 28, 11, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  const metricsText = [
    `Total de Itens: ${kpis.totalItens}`,
    `Volumes Físicos (Paletes/Fardos): ${kpis.totalContagem.toLocaleString('pt-BR')}`,
    `Total em Peças: ${kpis.totalEstoquePecas.toLocaleString('pt-BR')} un`,
    `Itens Zerados: ${kpis.itensZerados}`,
    `Estoque Baixo: ${kpis.itensBaixos}`
  ];

  const colWidth = (pageWidth - 28) / metricsText.length;
  metricsText.forEach((m, idx) => {
    doc.text(m, 14 + idx * colWidth + colWidth / 2, 37, { align: 'center' });
  });

  // Table Data
  const tableData = items.map((item, index) => {
    const total = item.contagem * item.multiplo;
    const status = item.contagem === 0 ? 'ZERADO' : item.contagem <= 2 ? 'ESTOQUE BAIXO' : 'REGULAR';

    return [
      index + 1,
      item.codigo,
      item.descricao,
      item.fornecedor,
      item.tipo,
      item.nomeItem,
      item.multiplo.toLocaleString('pt-BR'),
      item.unidadeContagem,
      item.contagem,
      total.toLocaleString('pt-BR'),
      status
    ];
  });

  autoTable(doc, {
    startY: 44,
    head: [[
      '#',
      'Código',
      'Descrição do Item',
      'Fornecedor',
      'Tipo',
      'Item',
      'Múltiplo',
      'Unidade',
      'Contagem',
      'Estoque Total (Un)',
      'Status'
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 1.8,
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 28 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 26 },
      4: { cellWidth: 20 },
      5: { fontStyle: 'bold', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 20 },
      7: { halign: 'center', cellWidth: 18 },
      8: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
      9: { halign: 'right', fontStyle: 'bold', cellWidth: 26 },
      10: { halign: 'center', fontStyle: 'bold', cellWidth: 26 }
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const item = items[data.row.index];
        if (!item) return;

        // Highlight Zerados in Red, Baixo in Amber
        if (data.column.index === 10 || data.column.index === 8) {
          if (item.contagem === 0) {
            data.cell.styles.fillColor = [254, 226, 226];
            data.cell.styles.textColor = [185, 28, 28];
          } else if (item.contagem <= 2) {
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.textColor = [180, 83, 9];
          }
        }
      }
    },
    didDrawPage: (data) => {
      const str = `Página ${data.pageNumber} de ${doc.getNumberOfPages()}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Controle de Estoque & Expedição · Relatório de Conferência de Inventário',
        14,
        pageHeight - 8
      );
      doc.text(str, pageWidth - 14, pageHeight - 8, { align: 'right' });
    }
  });

  const dateFile = new Date().toISOString().slice(0, 10);
  doc.save(`inventario_estoque_${dateFile}.pdf`);
};

/**
 * Generates and downloads Delphi 2-column inventory report in PDF.
 */
export const exportarDelphiPDF = (
  items: StockItem[],
  options: PDFExportOptions = {}
) => {
  const cdName = options.cdName || 'Centro de Distribuição VIX1';
  const gestorName = options.gestorName || 'Gestão de Almoxarifado';
  const today = new Date().toLocaleDateString('pt-BR');
  const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 25, pageWidth, 1.2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('DELPHI — RELATÓRIO DE INVENTÁRIO (CÓDIGO & QUANTIDADE)', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`${cdName} · Emissão: ${today} às ${nowTime} · Gestor: ${gestorName}`, 14, 18);

  const tableData = items.map(item => [
    item.codigo,
    (item.contagem * item.multiplo).toString()
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['Código', 'Quantidade']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.15
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 100, font: 'courier' },
      1: { cellWidth: 70, halign: 'right', font: 'courier', fontStyle: 'bold' }
    },
    didDrawPage: (data) => {
      const str = `Página ${data.pageNumber} de ${doc.getNumberOfPages()}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Relatório Delphi · Contagem e Estoque Total em Peças', 14, pageHeight - 8);
      doc.text(str, pageWidth - 14, pageHeight - 8, { align: 'right' });
    }
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`delphi_estoque_${dateStr}.pdf`);
};
