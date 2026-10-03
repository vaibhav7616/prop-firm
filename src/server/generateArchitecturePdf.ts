import fs from 'fs';
import path from 'path';

/**
 * Pure Node.js PDF 1.4 Generator for FundedShift Architecture Guide
 * Generates an executive, publication-grade multi-page PDF with exact byte offsets.
 */

interface TextLine {
  text: string;
  font: string;
  size: number;
  r: number;
  g: number;
  b: number;
  x: number;
  y: number;
}

interface RectOp {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: [number, number, number];
  stroke?: [number, number, number];
  lineWidth?: number;
}

interface LineOp {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: [number, number, number];
  lineWidth: number;
}

class PDFPage {
  public texts: TextLine[] = [];
  public rects: RectOp[] = [];
  public lines: LineOp[] = [];

  public addRect(
    x: number,
    y: number,
    w: number,
    h: number,
    fill?: [number, number, number],
    stroke?: [number, number, number],
    lineWidth = 1
  ) {
    this.rects.push({ x, y, w, h, fill, stroke, lineWidth });
  }

  public addLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    stroke: [number, number, number] = [0.7, 0.7, 0.7],
    lineWidth = 1
  ) {
    this.lines.push({ x1, y1, x2, y2, stroke, lineWidth });
  }

  public addText(
    text: string,
    x: number,
    y: number,
    font = 'F1',
    size = 10,
    color: [number, number, number] = [0.15, 0.15, 0.15]
  ) {
    this.texts.push({
      text,
      font,
      size,
      r: color[0],
      g: color[1],
      b: color[2],
      x,
      y,
    });
  }

  private escapePdfText(t: string): string {
    return t.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  public compileStream(): string {
    const ops: string[] = [];

    // 1. Draw Rectangles
    for (const r of this.rects) {
      ops.push('q');
      if (r.fill) {
        ops.push(`${r.fill[0].toFixed(3)} ${r.fill[1].toFixed(3)} ${r.fill[2].toFixed(3)} rg`);
      }
      if (r.stroke) {
        ops.push(`${r.stroke[0].toFixed(3)} ${r.stroke[1].toFixed(3)} ${r.stroke[2].toFixed(3)} RG`);
        ops.push(`${r.lineWidth || 1} w`);
      }
      ops.push(`${r.x.toFixed(2)} ${r.y.toFixed(2)} ${r.w.toFixed(2)} ${r.h.toFixed(2)} re`);
      if (r.fill && r.stroke) {
        ops.push('B');
      } else if (r.fill) {
        ops.push('f');
      } else if (r.stroke) {
        ops.push('S');
      }
      ops.push('Q');
    }

    // 2. Draw Lines
    for (const l of this.lines) {
      ops.push('q');
      ops.push(`${l.stroke[0].toFixed(3)} ${l.stroke[1].toFixed(3)} ${l.stroke[2].toFixed(3)} RG`);
      ops.push(`${l.lineWidth} w`);
      ops.push(`${l.x1.toFixed(2)} ${l.y1.toFixed(2)} m ${l.x2.toFixed(2)} ${l.y2.toFixed(2)} l S`);
      ops.push('Q');
    }

    // 3. Draw Texts
    for (const t of this.texts) {
      ops.push('BT');
      ops.push(`/${t.font} ${t.size} Tf`);
      ops.push(`${t.r.toFixed(3)} ${t.g.toFixed(3)} ${t.b.toFixed(3)} rg`);
      ops.push(`${t.x.toFixed(2)} ${t.y.toFixed(2)} Td`);
      ops.push(`(${this.escapePdfText(t.text)}) Tj`);
      ops.push('ET');
    }

    return ops.join('\n');
  }
}

export class ArchitecturePdfGenerator {
  public static generateDocument(): Buffer {
    const pages: PDFPage[] = [];

    // Helper for adding standard page headers and footers
    const addHeaderFooter = (page: PDFPage, pageNum: number, totalPages: number, pageTitle: string) => {
      if (pageNum === 1) return; // Cover page does not get standard header

      // Top running banner
      page.addRect(40, 755, 532, 22, [0.96, 0.97, 0.98]);
      page.addLine(40, 755, 572, 755, [0.85, 0.70, 0.25], 1.5);
      page.addText('FUNDEDSHIFT PROP FIRM  |  SYSTEM ARCHITECTURE MANUAL v2.0', 48, 762, 'F2', 8, [0.55, 0.45, 0.1]);
      page.addText(pageTitle.toUpperCase(), 564 - pageTitle.length * 5, 762, 'F1', 8, [0.4, 0.45, 0.5]);

      // Bottom footer
      page.addLine(40, 42, 572, 42, [0.85, 0.85, 0.85], 0.75);
      page.addText('CONFIDENTIAL & PROPRIETARY  --  FOR INTERNAL & COMPLIANCE USE ONLY', 48, 30, 'F1', 7.5, [0.5, 0.5, 0.5]);
      page.addText(`Page ${pageNum} of ${totalPages}`, 520, 30, 'F2', 8, [0.3, 0.3, 0.3]);
    };

    // =========================================================================
    // PAGE 1: COVER PAGE
    // =========================================================================
    const p1 = new PDFPage();
    // Background Dark Canvas
    p1.addRect(0, 0, 612, 792, [0.06, 0.08, 0.12]);

    // Gold Top Ribbon
    p1.addRect(0, 782, 612, 10, [0.92, 0.76, 0.20]);

    // Subtle Brand Card
    p1.addRect(50, 480, 512, 240, [0.10, 0.13, 0.19], [0.85, 0.70, 0.20], 1.5);

    p1.addText('FUNDEDSHIFT', 75, 670, 'F2', 32, [0.95, 0.80, 0.25]);
    p1.addText('PROPRIETARY TRADING FIRM PLATFORM', 75, 642, 'F2', 13, [0.85, 0.90, 0.95]);
    p1.addText('Institutional High-Frequency Architecture & Risk Intelligence Engine', 75, 622, 'F1', 11, [0.65, 0.72, 0.82]);

    p1.addLine(75, 606, 520, 606, [0.92, 0.76, 0.20], 1);

    p1.addText('Document Type:', 75, 580, 'F2', 9.5, [0.92, 0.76, 0.20]);
    p1.addText('Comprehensive Technical Architecture, Engine Specifications & DB Schema', 165, 580, 'F1', 9.5, [0.9, 0.9, 0.9]);

    p1.addText('System Version:', 75, 560, 'F2', 9.5, [0.92, 0.76, 0.20]);
    p1.addText('v2.0.0 Production Release (PostgreSQL / ECN Real-Time Engine)', 165, 560, 'F1', 9.5, [0.9, 0.9, 0.9]);

    p1.addText('Release Date:', 75, 540, 'F2', 9.5, [0.92, 0.76, 0.20]);
    p1.addText('October 2026', 165, 540, 'F1', 9.5, [0.9, 0.9, 0.9]);

    p1.addText('Environment:', 75, 520, 'F2', 9.5, [0.92, 0.76, 0.20]);
    p1.addText('Full Production Stack: Node.js 22, Express, React 19, TypeScript, PostgreSQL 16', 165, 520, 'F1', 9.5, [0.9, 0.9, 0.9]);

    p1.addText('Author / Team:', 75, 500, 'F2', 9.5, [0.92, 0.76, 0.20]);
    p1.addText('Core Architecture & Financial Risk Engineering Division', 165, 500, 'F1', 9.5, [0.9, 0.9, 0.9]);

    // Table of Contents Card on Cover
    p1.addRect(50, 110, 512, 340, [0.08, 0.10, 0.15], [0.20, 0.25, 0.35], 1);
    p1.addText('TABLE OF CONTENTS', 75, 420, 'F2', 12, [0.95, 0.80, 0.25]);
    p1.addLine(75, 410, 520, 410, [0.3, 0.35, 0.45], 0.5);

    const toc = [
      { num: 'SECTION 1', title: 'System Overview, Architecture Topology & Layer Stack', page: 'Page 2' },
      { num: 'SECTION 2', title: 'Trader Lifecycle, Evaluation Challenges & Phase Rules', page: 'Page 3' },
      { num: 'SECTION 3', title: 'Simulated MT5 Execution Engine & ECN Order Matcher', page: 'Page 4' },
      { num: 'SECTION 4', title: 'Dynamic Risk Shield, Real-Time Drawdown & Breach Logic', page: 'Page 5' },
      { num: 'SECTION 5', title: 'PostgreSQL Relational Schema & Persistence Architecture', page: 'Page 6' },
      { num: 'SECTION 6', title: 'Financial Rails, KYC Compliance & Payout Processing', page: 'Page 7' },
      { num: 'SECTION 7', title: 'Support Desk, Admin Management Suite & Security Standards', page: 'Page 8' },
    ];

    let tocY = 385;
    for (const item of toc) {
      p1.addText(item.num, 75, tocY, 'F2', 9, [0.92, 0.76, 0.20]);
      p1.addText(item.title, 145, tocY, 'F1', 9, [0.85, 0.88, 0.92]);
      p1.addText(item.page, 490, tocY, 'F2', 9, [0.65, 0.70, 0.80]);
      p1.addLine(75, tocY - 6, 525, tocY - 6, [0.15, 0.18, 0.24], 0.5);
      tocY -= 36;
    }

    p1.addText('STRICTLY CONFIDENTIAL -- PROPRIETARY TRADING ARCHITECTURE SPECIFICATION', 105, 55, 'F2', 8, [0.55, 0.60, 0.70]);
    pages.push(p1);

    // =========================================================================
    // PAGE 2: ARCHITECTURE TOPOLOGY & SYSTEM OVERVIEW
    // =========================================================================
    const p2 = new PDFPage();
    addHeaderFooter(p2, 2, 8, 'System Topology & Core Stack');

    p2.addText('1. Executive Overview & System Topology', 45, 730, 'F2', 15, [0.1, 0.15, 0.25]);
    p2.addLine(45, 722, 565, 722, [0.85, 0.70, 0.20], 1.5);

    p2.addText('FundedShift is a high-performance proprietary trading firm platform engineered to deliver institutional-grade', 45, 706, 'F1', 9.5);
    p2.addText('evaluation challenges, sub-millisecond simulated trade execution, zero-tolerance automated risk monitoring,', 45, 693, 'F1', 9.5);
    p2.addText('and seamless profit disbursements to funded traders worldwide.', 45, 680, 'F1', 9.5);

    // 4-Layer Architecture Diagram Representation
    p2.addText('MULTI-TIER ARCHITECTURE LAYOUT', 45, 655, 'F2', 10.5, [0.85, 0.65, 0.15]);

    // Layer 1: Client
    p2.addRect(45, 580, 520, 60, [0.95, 0.97, 1.0], [0.2, 0.4, 0.8], 1);
    p2.addText('LAYER 1: PRESENTATION & CLIENT TIER (React 19 + TypeScript + Vite)', 55, 624, 'F2', 9.5, [0.1, 0.25, 0.6]);
    p2.addText('Trader Web Terminal (TradingView Charts, Order Panel, Live Quotes, Rules Gauge, Position Manager)', 55, 608, 'F1', 8.5);
    p2.addText('Trader Portal: Account Metrics, Objectives, KYC Portal, Invoices, Payout Desk, Certificates | Admin Control Panel', 55, 592, 'F1', 8.5);

    // Layer 2: API Gateway
    p2.addRect(45, 505, 520, 65, [0.95, 0.99, 0.96], [0.1, 0.6, 0.3], 1);
    p2.addText('LAYER 2: API GATEWAY & SECURITY MIDDLEWARE (Express.js + Node 22)', 55, 553, 'F2', 9.5, [0.08, 0.45, 0.2]);
    p2.addText('JWT Token & Dual-Header Auth (Bearer & x-user-id fallback) | Role-Based Access Control (Trader vs Admin)', 55, 537, 'F1', 8.5);
    p2.addText('IP Rate Limiting (Auth: 40/15min, Orders: 60/min, Checkout: 20/min) | Strict Input Validation & Sanitize Sanitizers', 55, 521, 'F1', 8.5);

    // Layer 3: Core Engines
    p2.addRect(45, 410, 520, 85, [0.99, 0.97, 0.93], [0.8, 0.5, 0.1], 1);
    p2.addText('LAYER 3: CORE FINANCIAL & TRADING ENGINES', 55, 478, 'F2', 9.5, [0.7, 0.4, 0.05]);
    p2.addText('1. Simulated ECN Execution Engine: Sub-millisecond tick matcher, slippage, spread model, margin calculation.', 55, 462, 'F1', 8.5);
    p2.addText('2. Dynamic Risk Shield Engine: Intraday high-water loss computation, trailing/static max loss, emergency flattener.', 55, 446, 'F1', 8.5);
    p2.addText('3. Transition & Recovery Engine: Automated Step 1 -> Step 2 -> Funded provisioning + Breached account resets.', 55, 430, 'F1', 8.5);
    p2.addText('4. Payout & Revenue Split Engine: High-water mark tracking, 80/90% profit share calculation, multi-rail dispatch.', 55, 414, 'F1', 8.5);

    // Layer 4: Persistence
    p2.addRect(45, 335, 520, 65, [0.97, 0.95, 0.99], [0.5, 0.2, 0.7], 1);
    p2.addText('LAYER 4: PERSISTENCE & DATA STORAGE TIER (PostgreSQL 16 Relational Engine)', 55, 383, 'F2', 9.5, [0.4, 0.15, 0.6]);
    p2.addText('PostgreSQL 16: 16 relational tables with ACID transactions, foreign keys, and indexes.', 55, 367, 'F1', 8.5);
    p2.addText('Synchronous disk persistence via DBEngine with automated audit logging of all sensitive administrative actions.', 55, 351, 'F1', 8.5);

    // Key Performance Metrics Table
    p2.addText('SYSTEM PERFORMANCE BENCHMARKS', 45, 312, 'F2', 10.5, [0.85, 0.65, 0.15]);
    p2.addRect(45, 175, 520, 125, [0.98, 0.98, 0.99], [0.8, 0.82, 0.85], 0.75);

    const metrics = [
      ['Component', 'Specification / Target', 'Operational Protocol'],
      ['Market Tick Refresh Rate', '200 ms live interval', 'Simulated ECN feed with live crypto & forex spread'],
      ['Order Execution Latency', '< 15 ms simulated', 'Institutional fill simulation with realistic slippage'],
      ['Risk Breach Detection', '< 50 ms tick monitor', 'Instant position flattening and account locking'],
      ['Database Write Latency', '< 5 ms per transaction', 'ACID compliant structured storage with audit trailing'],
      ['Concurrent Traders', '10,000+ active sessions', 'Stateless API architecture with cluster scaling'],
    ];

    let rowY = 282;
    for (let i = 0; i < metrics.length; i++) {
      const row = metrics[i];
      const isHeader = i === 0;
      if (isHeader) {
        p2.addRect(45, rowY - 4, 520, 18, [0.88, 0.90, 0.94]);
      }
      p2.addText(row[0], 55, rowY, isHeader ? 'F2' : 'F2', isHeader ? 8.5 : 8, isHeader ? [0.1, 0.2, 0.4] : [0.2, 0.2, 0.2]);
      p2.addText(row[1], 210, rowY, isHeader ? 'F2' : 'F1', isHeader ? 8.5 : 8, isHeader ? [0.1, 0.2, 0.4] : [0.1, 0.4, 0.2]);
      p2.addText(row[2], 360, rowY, isHeader ? 'F2' : 'F1', isHeader ? 8.5 : 8, isHeader ? [0.1, 0.2, 0.4] : [0.3, 0.3, 0.3]);
      p2.addLine(45, rowY - 4, 565, rowY - 4, [0.85, 0.85, 0.85], 0.5);
      rowY -= 19;
    }

    pages.push(p2);

    // =========================================================================
    // PAGE 3: TRADER LIFECYCLE & EVALUATION CHALLENGES
    // =========================================================================
    const p3 = new PDFPage();
    addHeaderFooter(p3, 3, 8, 'Trader Lifecycle & Evaluation Model');

    p3.addText('2. Trader Lifecycle, Evaluation Challenges & Rules', 45, 730, 'F2', 15, [0.1, 0.15, 0.25]);
    p3.addLine(45, 722, 565, 722, [0.85, 0.70, 0.20], 1.5);

    p3.addText('FundedShift offers three premier evaluation pathways: Two-Step Evaluation, One-Step Challenge, and Instant', 45, 706, 'F1', 9.5);
    p3.addText('Funding. Traders must demonstrate disciplined risk management and consistent profitability.', 45, 693, 'F1', 9.5);

    // Step-by-Step Flow Chart Box
    p3.addRect(45, 555, 520, 125, [0.97, 0.98, 0.99], [0.8, 0.85, 0.9], 1);
    p3.addText('TRADER PROGRESSION PATHWAY', 55, 664, 'F2', 10, [0.1, 0.25, 0.55]);

    const stages = [
      { step: 'STAGE 1', title: 'Evaluation Step 1', detail: '8% Profit Target\n5% Daily Loss\n10% Max Drawdown' },
      { step: 'STAGE 2', title: 'Verification Step 2', detail: '5% Profit Target\n5% Daily Loss\n10% Max Drawdown' },
      { step: 'STAGE 3', title: 'Funded Live Account', detail: '0% Profit Target\n80%-90% Profit Split\nBi-weekly Payouts' },
      { step: 'STAGE 4', title: 'Scaling Plan', detail: '+25% Capital Increase\nEvery 3 Months with\n10%+ Cumulative Gain' },
    ];

    let sx = 55;
    for (const st of stages) {
      p3.addRect(sx, 565, 115, 85, [1, 1, 1], [0.85, 0.7, 0.2], 1);
      p3.addText(st.step, sx + 8, 636, 'F2', 8, [0.85, 0.65, 0.15]);
      p3.addText(st.title, sx + 8, 622, 'F2', 8.5, [0.15, 0.2, 0.3]);
      const lines = st.detail.split('\n');
      let ly = 606;
      for (const l of lines) {
        p3.addText(l, sx + 8, ly, 'F1', 7.5, [0.35, 0.4, 0.45]);
        ly -= 12;
      }
      sx += 128;
    }

    // Challenge Matrix Table
    p3.addText('EVALUATION TIERS & SPECIFICATIONS MATRIX', 45, 535, 'F2', 10.5, [0.85, 0.65, 0.15]);
    p3.addRect(45, 345, 520, 175, [0.98, 0.98, 0.99], [0.8, 0.82, 0.85], 0.75);

    const tiers = [
      ['Account Size', 'Model', 'Phase 1 Target', 'Phase 2 Target', 'Daily Limit', 'Max Drawdown', 'Leverage', 'Price'],
      ['$5,000', '2-Step', '$400 (8%)', '$250 (5%)', '$250 (5%)', '$500 (10%)', '1:100', '$39'],
      ['$10,000', '2-Step', '$800 (8%)', '$500 (5%)', '$500 (5%)', '$1,000 (10%)', '1:100', '$79'],
      ['$25,000', '2-Step', '$2,000 (8%)', '$1,250 (5%)', '$1,250 (5%)', '$2,500 (10%)', '1:100', '$169'],
      ['$50,000', '2-Step', '$4,000 (8%)', '$2,500 (5%)', '$2,500 (5%)', '$5,000 (10%)', '1:100', '$289'],
      ['$100,000', '2-Step', '$8,000 (8%)', '$5,000 (5%)', '$5,000 (5%)', '$10,000 (10%)', '1:100', '$499'],
      ['$200,000', '2-Step', '$16,000 (8%)', '$10,000 (5%)', '$10,000 (5%)', '$20,000 (10%)', '1:100', '$899'],
      ['$10,000', 'Instant', 'N/A (Funded)', 'N/A (Funded)', '$300 (3%)', '$600 (6%)', '1:50', '$149'],
    ];

    let tRowY = 505;
    for (let i = 0; i < tiers.length; i++) {
      const row = tiers[i];
      const isH = i === 0;
      if (isH) {
        p3.addRect(45, tRowY - 4, 520, 18, [0.88, 0.90, 0.94]);
      }
      p3.addText(row[0], 52, tRowY, isH ? 'F2' : 'F2', 7.5, isH ? [0.1, 0.2, 0.4] : [0.15, 0.15, 0.15]);
      p3.addText(row[1], 110, tRowY, isH ? 'F2' : 'F1', 7.5);
      p3.addText(row[2], 165, tRowY, isH ? 'F2' : 'F1', 7.5, isH ? [0.1, 0.2, 0.4] : [0.1, 0.5, 0.2]);
      p3.addText(row[3], 240, tRowY, isH ? 'F2' : 'F1', 7.5, isH ? [0.1, 0.2, 0.4] : [0.1, 0.5, 0.2]);
      p3.addText(row[4], 315, tRowY, isH ? 'F2' : 'F1', 7.5, isH ? [0.1, 0.2, 0.4] : [0.7, 0.3, 0.1]);
      p3.addText(row[5], 385, tRowY, isH ? 'F2' : 'F1', 7.5, isH ? [0.1, 0.2, 0.4] : [0.7, 0.1, 0.1]);
      p3.addText(row[6], 465, tRowY, isH ? 'F2' : 'F1', 7.5);
      p3.addText(row[7], 525, tRowY, isH ? 'F2' : 'F2', 7.5, isH ? [0.1, 0.2, 0.4] : [0.8, 0.6, 0.1]);
      p3.addLine(45, tRowY - 4, 565, tRowY - 4, [0.85, 0.85, 0.85], 0.5);
      tRowY -= 20;
    }

    // Automated Transition Engine Note
    p3.addRect(45, 180, 520, 145, [0.96, 0.99, 0.97], [0.2, 0.6, 0.3], 1);
    p3.addText('AUTOMATED ACCOUNT TRANSITION ENGINE', 55, 310, 'F2', 9.5, [0.1, 0.5, 0.2]);
    p3.addText('1. Step 1 Target Achieved: Risk engine detects balance reaching profit target. All open positions are flat.', 55, 294, 'F1', 8.5);
    p3.addText('2. Scheduled Transition: Account status is updated to PASSED. An automated background transition timer provisions', 55, 280, 'F1', 8.5);
    p3.addText('   the Step 2 Verification account within 1 to 2 hours with new login credentials.', 55, 268, 'F1', 8.5);
    p3.addText('3. Step 2 Target Achieved: System marks verification passed and generates live Funded Account certificate.', 55, 254, 'F1', 8.5);
    p3.addText('4. Immediate KYC Prompt: Funded account is issued with zero profit target and up to 90% profit split eligibility.', 55, 240, 'F1', 8.5);
    p3.addText('5. Account Recovery Program: Breached accounts receive discounted reset options (-20% to -50%) without full rebuy.', 55, 226, 'F1', 8.5);

    pages.push(p3);

    // =========================================================================
    // PAGE 4: SIMULATED ECN EXECUTION ENGINE
    // =========================================================================
    const p4 = new PDFPage();
    addHeaderFooter(p4, 4, 8, 'ECN Simulated Execution Engine');

    p4.addText('3. Simulated MT5 Execution Engine & Market Feed', 45, 730, 'F2', 15, [0.1, 0.15, 0.25]);
    p4.addLine(45, 722, 565, 722, [0.85, 0.70, 0.20], 1.5);

    p4.addText('The platform contains an integrated high-frequency institutional simulator mimicking MT5/cTrader execution.', 45, 706, 'F1', 9.5);
    p4.addText('It continuously computes realistic bid/ask spreads, market slippage, margin consumption, and floating PnL.', 45, 693, 'F1', 9.5);

    // Market Generator Spec Box
    p4.addRect(45, 530, 520, 145, [0.97, 0.98, 1.0], [0.2, 0.35, 0.7], 1);
    p4.addText('REAL-TIME MARKET FEED & ASSET CLASSES', 55, 660, 'F2', 10, [0.15, 0.3, 0.65]);

    const assets = [
      ['Forex Majors', 'EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD, USDCHF, NZDUSD', '0.1 - 0.4 pip spread | 1:100 leverage'],
      ['Forex Crosses', 'EURGBP, EURJPY, GBPJPY', '0.3 - 0.8 pip spread | 1:100 leverage'],
      ['Precious Metals', 'XAUUSD (Gold 100oz), XAGUSD (Silver 5000oz)', '1.5 - 2.5 pip spread | 1:50 leverage'],
      ['Global Indices', 'NAS100 (Nasdaq), US30 (Dow Jones), SPX500 (S&P 500)', '0.8 - 1.5 pt spread | 1:50 leverage'],
      ['Digital Assets', 'BTCUSD (Bitcoin), ETHUSD (Ethereum), SOLUSD (Solana)', '24/7 ECN liquidity | 1:20 leverage'],
    ];

    let ay = 642;
    for (const a of assets) {
      p4.addText(a[0], 55, ay, 'F2', 8.5, [0.1, 0.2, 0.35]);
      p4.addText(a[1], 155, ay, 'F1', 8, [0.25, 0.3, 0.35]);
      p4.addText(a[2], 410, ay, 'F2', 7.5, [0.2, 0.5, 0.25]);
      ay -= 22;
    }

    // Mathematical Calculation Box
    p4.addText('CORE FINANCIAL EQUATIONS & FORMULAS', 45, 510, 'F2', 10.5, [0.85, 0.65, 0.15]);
    p4.addRect(45, 340, 520, 155, [0.99, 0.99, 0.98], [0.85, 0.7, 0.2], 1);

    p4.addText('1. Floating PnL Formulation:', 55, 480, 'F2', 9, [0.8, 0.55, 0.1]);
    p4.addText('   BUY:   Floating PnL = (Current Bid Price - Entry Price) * Lot Size * Contract Size', 55, 466, 'F3', 8.5, [0.15, 0.15, 0.15]);
    p4.addText('   SELL:  Floating PnL = (Entry Price - Current Ask Price) * Lot Size * Contract Size', 55, 452, 'F3', 8.5, [0.15, 0.15, 0.15]);

    p4.addText('2. Used Margin Requirement:', 55, 434, 'F2', 9, [0.8, 0.55, 0.1]);
    p4.addText('   Used Margin = (Lot Size * Contract Size * Entry Price) / Account Leverage', 55, 420, 'F3', 8.5, [0.15, 0.15, 0.15]);

    p4.addText('3. Equity & Free Margin Calculation:', 55, 402, 'F2', 9, [0.8, 0.55, 0.1]);
    p4.addText('   Live Equity = Account Balance + Sum(Open Positions Floating PnL)', 55, 388, 'F3', 8.5, [0.15, 0.15, 0.15]);
    p4.addText('   Free Margin = Max(0, Live Equity - Used Margin)', 55, 374, 'F3', 8.5, [0.15, 0.15, 0.15]);
    p4.addText('   Margin Level % = (Live Equity / Used Margin) * 100', 55, 360, 'F3', 8.5, [0.15, 0.15, 0.15]);

    // Order Execution Lifecycle
    p4.addText('ORDER EXECUTION & VALIDATION CHECKS', 45, 320, 'F2', 10.5, [0.85, 0.65, 0.15]);
    p4.addRect(45, 175, 520, 130, [0.98, 0.98, 0.99], [0.8, 0.82, 0.85], 0.75);

    p4.addText('When trader submits BUY/SELL on the Trading Terminal:', 55, 290, 'F2', 8.5, [0.15, 0.2, 0.3]);
    p4.addText('1. Status Check: Validates account status is ACTIVE or FUNDED. If PASSED or BREACHED, order is rejected.', 55, 276, 'F1', 8);
    p4.addText('2. Weekend / Session Check: Rejects if market is closed (Forex closed Friday 22:00 to Sunday 22:00 UTC).', 55, 262, 'F1', 8);
    p4.addText('3. Lot Size Cap Check: Ensures lot size does not exceed plan maximum (e.g. 50 lots on 100k account).', 55, 248, 'F1', 8);
    p4.addText('4. Margin Check: Ensures Free Margin > Required Margin. Prevents negative margin overleveraging.', 55, 234, 'F1', 8);
    p4.addText('5. Position Recording: Position is assigned unique UUID, timestamped, and immediately saved to database.', 55, 220, 'F1', 8);
    p4.addText('6. Risk Tick Broadcast: Position is added to active monitoring loop for real-time Stop Loss & Take Profit checks.', 55, 206, 'F1', 8);

    pages.push(p4);

    // =========================================================================
    // PAGE 5: DYNAMIC RISK SHIELD & RULE ENFORCEMENT
    // =========================================================================
    const p5 = new PDFPage();
    addHeaderFooter(p5, 5, 8, 'Dynamic Risk Shield & Breach Engine');

    p5.addText('4. Dynamic Risk Shield, Real-Time Drawdown & Breach Logic', 45, 730, 'F2', 15, [0.1, 0.15, 0.25]);
    p5.addLine(45, 722, 565, 722, [0.85, 0.70, 0.20], 1.5);

    p5.addText('The Risk Engine runs asynchronously every 200 milliseconds to monitor active equity fluctuations against', 45, 706, 'F1', 9.5);
    p5.addText('daily drawdown limits, maximum overall loss boundaries, and account trading rules.', 45, 693, 'F1', 9.5);

    // Daily Loss Limit Card
    p5.addRect(45, 530, 520, 145, [0.99, 0.96, 0.96], [0.8, 0.2, 0.2], 1);
    p5.addText('RULE 1: MAXIMUM DAILY LOSS LIMIT (5%)', 55, 660, 'F2', 10, [0.75, 0.15, 0.15]);
    p5.addText('The daily loss limit protects firm capital from runaway market volatility.', 55, 644, 'F1', 8.5);
    p5.addText('Baseline Reset: Exactly at 00:00 UTC every trading day, the system records:', 55, 630, 'F2', 8.5, [0.2, 0.2, 0.2]);
    p5.addText('   start_of_day_baseline = Max(start_of_day_balance, start_of_day_equity)', 55, 616, 'F3', 8.5, [0.5, 0.1, 0.1]);
    p5.addText('Max Daily Permitted Drawdown = 5% of start_of_day_baseline', 55, 602, 'F1', 8.5);
    p5.addText('Live Intraday Loss Formula = Max(0, start_of_day_baseline - Live Equity)', 55, 588, 'F3', 8.5, [0.5, 0.1, 0.1]);
    p5.addText('If Live Equity drops below (start_of_day_baseline - 5%), account breaches immediately.', 55, 574, 'F2', 8.5, [0.8, 0.1, 0.1]);
    p5.addText('Notice: Daily drawdown includes BOTH closed losses AND floating unrealized losses.', 55, 560, 'F1', 8, [0.4, 0.4, 0.4]);

    // Maximum Loss Limit Card
    p5.addRect(45, 365, 520, 150, [0.99, 0.97, 0.94], [0.85, 0.5, 0.15], 1);
    p5.addText('RULE 2: MAXIMUM OVERALL DRAWDOWN (10% STATIC / TRAILING)', 55, 500, 'F2', 10, [0.75, 0.4, 0.1]);
    p5.addText('The total account loss cannot exceed 10% of the initial account allocation.', 55, 484, 'F1', 8.5);
    p5.addText('Two Drawdown Models:', 55, 470, 'F2', 8.5, [0.2, 0.2, 0.2]);
    p5.addText('1. Static Model (Evaluation Challenges):', 55, 456, 'F2', 8, [0.2, 0.2, 0.2]);
    p5.addText('   Floor remains permanently at starting_balance - 10%. (e.g. $100,000 account floor is $90,000).', 55, 444, 'F1', 8);
    p5.addText('2. Trailing High-Water Mark Model (Instant Funding):', 55, 430, 'F2', 8, [0.2, 0.2, 0.2]);
    p5.addText('   Floor trails the highest equity achieved until reaching starting balance, locking in risk parameters.', 55, 418, 'F1', 8);
    p5.addText('Max Loss Violation = (Live Equity < Max Permitted Drawdown Floor)', 55, 402, 'F3', 8.5, [0.6, 0.2, 0.05]);
    p5.addText('Triggering breach immediately freezes trading and marks account as BREACHED.', 55, 388, 'F2', 8.5, [0.8, 0.1, 0.1]);

    // Emergency Flattener Execution
    p5.addText('EMERGENCY LIQUIDATION & SAFETY INTERVENTIONS', 45, 345, 'F2', 10.5, [0.85, 0.65, 0.15]);
    p5.addRect(45, 175, 520, 155, [0.98, 0.98, 0.99], [0.8, 0.82, 0.85], 0.75);

    p5.addText('Protocol Executed on Rule Breach Detection:', 55, 315, 'F2', 8.5, [0.15, 0.2, 0.3]);
    p5.addText('1. Emergency Position Flat: RuleEngine instantly closes all open positions across all currency pairs.', 55, 301, 'F1', 8);
    p5.addText('2. Status Lock: Sets account.status = "BREACHED" and timestamps breached_at.', 55, 287, 'F1', 8);
    p5.addText('3. Breach Log Insertion: Writes detailed RuleViolationEntity with triggering price, balance, and violation margin.', 55, 273, 'F1', 8);
    p5.addText('4. Audit Trail: Appends security event to audit_logs for compliance record.', 55, 259, 'F1', 8);
    p5.addText('5. Trader In-App Alert: Creates high-priority Notification informing trader of exact breach reasons.', 55, 245, 'F1', 8);
    p5.addText('6. Recovery Program Activation: Calculates discounted reset pricing for account rehabilitation.', 55, 231, 'F1', 8);

    pages.push(p5);

    // =========================================================================
    // PAGE 6: POSTGRESQL RELATIONAL SCHEMA
    // =========================================================================
    const p6 = new PDFPage();
    addHeaderFooter(p6, 6, 8, 'PostgreSQL Schema & Persistence');

    p6.addText('5. PostgreSQL Relational Schema & Persistence Architecture', 45, 730, 'F2', 15, [0.1, 0.15, 0.25]);
    p6.addLine(45, 722, 565, 722, [0.85, 0.70, 0.20], 1.5);

    p6.addText('In production, FundedShift connects to PostgreSQL 16. The database is partitioned into 16 core tables', 45, 706, 'F1', 9.5);
    p6.addText('providing ACID guarantees, indexed query paths, and automated audit tracking.', 45, 693, 'F1', 9.5);

    // Schema Table Matrix
    p6.addText('PRODUCTION POSTGRESQL TABLES SPECIFICATION', 45, 670, 'F2', 10.5, [0.85, 0.65, 0.15]);
    p6.addRect(45, 260, 520, 395, [0.98, 0.98, 0.99], [0.8, 0.82, 0.85], 0.75);

    const schemaTables = [
      ['Table Name', 'Primary Key', 'Foreign Keys', 'Key Columns / Types', 'Indexes'],
      ['users', 'id (VARCHAR)', 'None', 'email, password_hash, role, kyc_status, 2fa', 'email (UNIQUE), affiliate_code'],
      ['account_plans', 'id (VARCHAR)', 'None', 'name, type, account_size, price, rules (JSONB)', 'type, is_active'],
      ['trading_accounts', 'id (VARCHAR)', 'user_id -> users', 'account_number, balance, equity, phase, status', 'user_id, account_number, status'],
      ['positions', 'id (VARCHAR)', 'account_id, user_id', 'symbol, type, lot_size, entry, sl, tp, pnl, status', 'account_id, status, symbol'],
      ['trade_orders', 'id (VARCHAR)', 'account_id, user_id', 'symbol, type, lot_size, price, status, executed_at', 'account_id, executed_at'],
      ['rule_violations', 'id (VARCHAR)', 'account_id, user_id', 'rule_type, threshold, actual_val, balance_at_breach', 'account_id, created_at'],
      ['orders', 'id (VARCHAR)', 'user_id -> users', 'plan_id, account_size, total_price, coupon, status', 'user_id, status, created_at'],
      ['payments', 'id (VARCHAR)', 'order_id, user_id', 'gateway, amount, currency, transaction_id, status', 'order_id, transaction_id'],
      ['payout_requests', 'id (VARCHAR)', 'account_id, user_id', 'total_profit, trader_share, method, address, status', 'user_id, account_id, status'],
      ['kyc_submissions', 'id (VARCHAR)', 'user_id -> users', 'document_type, doc_number, country, status', 'user_id, status, submitted_at'],
      ['support_tickets', 'id (VARCHAR)', 'user_id -> users', 'subject, category, priority, status, messages (JSONB)', 'user_id, status, category'],
      ['affiliate_withdrawals', 'id (VARCHAR)', 'user_id -> users', 'amount, payout_method, payment_details, status', 'user_id, status'],
      ['promo_codes', 'id (VARCHAR)', 'None', 'code, discount_type, discount_val, uses, is_active', 'code (UNIQUE), is_active'],
      ['audit_logs', 'id (VARCHAR)', 'None', 'actor_id, actor_role, action, target_id, ip_address', 'actor_id, action, created_at'],
      ['notifications', 'id (VARCHAR)', 'user_id -> users', 'title, body, type, is_read, created_at', 'user_id, is_read'],
    ];

    let sRowY = 640;
    for (let i = 0; i < schemaTables.length; i++) {
      const row = schemaTables[i];
      const isH = i === 0;
      if (isH) {
        p6.addRect(45, sRowY - 4, 520, 18, [0.88, 0.90, 0.94]);
      }
      p6.addText(row[0], 50, sRowY, isH ? 'F2' : 'F2', 7.5, isH ? [0.1, 0.2, 0.4] : [0.1, 0.35, 0.6]);
      p6.addText(row[1], 140, sRowY, isH ? 'F2' : 'F1', 7.5);
      p6.addText(row[2], 215, sRowY, isH ? 'F2' : 'F1', 7.5, isH ? [0.1, 0.2, 0.4] : [0.5, 0.2, 0.1]);
      p6.addText(row[3], 320, sRowY, isH ? 'F2' : 'F1', 7, isH ? [0.1, 0.2, 0.4] : [0.25, 0.25, 0.25]);
      p6.addText(row[4], 475, sRowY, isH ? 'F2' : 'F1', 7, isH ? [0.1, 0.2, 0.4] : [0.2, 0.5, 0.2]);
      p6.addLine(45, sRowY - 4, 565, sRowY - 4, [0.88, 0.88, 0.88], 0.5);
      sRowY -= 24;
    }

    // Persistence Integrity Note
    p6.addRect(45, 175, 520, 70, [0.96, 0.98, 0.97], [0.2, 0.6, 0.3], 1);
    p6.addText('TRANSACTION INTEGRITY & DISK SYNCING', 55, 230, 'F2', 9, [0.1, 0.5, 0.2]);
    p6.addText('1. Atomic Ledgering: Trade placements, margin decrements, and balance changes occur in isolated transactions.', 55, 216, 'F1', 8);
    p6.addText('2. JSON Backup Mirroring: System maintains continuous snapshot syncing at .data/propfirm_database.json.', 55, 202, 'F1', 8);
    p6.addText('3. Cascading Integrity: User deletion cascades to trading accounts, positions, and tickets with full referential integrity.', 55, 188, 'F1', 8);

    pages.push(p6);

    // =========================================================================
    // PAGE 7: FINANCIAL RAILS, KYC & PAYOUT PROCESSING
    // =========================================================================
    const p7 = new PDFPage();
    addHeaderFooter(p7, 7, 8, 'Financial Rails, KYC & Payouts');

    p7.addText('6. Financial Rails, KYC Compliance & Payout Processing', 45, 730, 'F2', 15, [0.1, 0.15, 0.25]);
    p7.addLine(45, 722, 565, 722, [0.85, 0.70, 0.20], 1.5);

    p7.addText('The payout engine manages compliant profit disbursements. Traders must complete identity verification', 45, 706, 'F1', 9.5);
    p7.addText('prior to requesting profit withdrawals on live funded accounts.', 45, 693, 'F1', 9.5);

    // KYC Compliance Pipeline Box
    p7.addRect(45, 520, 520, 155, [0.97, 0.98, 1.0], [0.2, 0.4, 0.8], 1);
    p7.addText('IDENTITY VERIFICATION & KYC COMPLIANCE WORKFLOW', 55, 655, 'F2', 10, [0.1, 0.25, 0.6]);

    p7.addText('1. Document Upload (/dashboard/security):', 55, 638, 'F2', 8.5, [0.2, 0.2, 0.2]);
    p7.addText('   Trader selects document type: PASSPORT, DRIVERS_LICENSE, or NATIONAL_ID.', 55, 626, 'F1', 8);
    p7.addText('   Submits legal document number, issuing country, and document metadata.', 55, 614, 'F1', 8);

    p7.addText('2. Compliance Queue Ingestion (/api/kyc/submit):', 55, 598, 'F2', 8.5, [0.2, 0.2, 0.2]);
    p7.addText('   Record inserted into kyc_submissions with status = "PENDING".', 55, 586, 'F1', 8);
    p7.addText('   Trader dashboard updates to "Pending Compliance Review" amber badge.', 55, 574, 'F1', 8);

    p7.addText('3. Administrator Review (/admin/kyc):', 55, 558, 'F2', 8.5, [0.2, 0.2, 0.2]);
    p7.addText('   Admin evaluates submission against sanctions and PEP lists. Approves or Rejects with notes.', 55, 546, 'F1', 8);
    p7.addText('   Approval sets user.is_verified = true and unlocks the automated profit withdrawal gateway.', 55, 534, 'F1', 8);

    // Payout Calculation Box
    p7.addText('PROFIT SPLIT COMPUTATION & PAYOUT DISBURSEMENT', 45, 500, 'F2', 10.5, [0.85, 0.65, 0.15]);
    p7.addRect(45, 345, 520, 145, [0.99, 0.99, 0.97], [0.85, 0.7, 0.2], 1);

    p7.addText('Eligibility Criteria for Payout:', 55, 474, 'F2', 9, [0.8, 0.55, 0.1]);
    p7.addText('1. Account must be in FUNDED status with profit > 0 (Live Equity > Starting Balance).', 55, 460, 'F1', 8.5);
    p7.addText('2. Trader must have passed KYC compliance (user.is_verified === true).', 55, 446, 'F1', 8.5);
    p7.addText('3. No open positions at the time of payout calculation (flat account).', 55, 432, 'F1', 8.5);

    p7.addText('Profit Split Formula:', 55, 414, 'F2', 9, [0.8, 0.55, 0.1]);
    p7.addText('Total Profit = Current Balance - Starting Balance', 55, 400, 'F3', 8.5, [0.15, 0.15, 0.15]);
    p7.addText('Trader Payout Amount = Total Profit * (Trader Split % / 100)  [Standard 80%, Scaled 90%]', 55, 386, 'F3', 8.5, [0.15, 0.15, 0.15]);
    p7.addText('Firm Retained Share  = Total Profit - Trader Payout Amount', 55, 372, 'F3', 8.5, [0.15, 0.15, 0.15]);
    p7.addText('High-Water Mark Reset: Account balance is adjusted to initial allocation following payout dispatch.', 55, 358, 'F1', 8, [0.4, 0.4, 0.4]);

    // Payment Gateways Supported
    p7.addText('PAYMENT & PAYOUT RAILS INTEGRATION', 45, 325, 'F2', 10.5, [0.85, 0.65, 0.15]);
    p7.addRect(45, 175, 520, 140, [0.98, 0.98, 0.99], [0.8, 0.82, 0.85], 0.75);

    const rails = [
      ['Inbound Checkout', 'Razorpay, Stripe, UPI (GPay, PhonePe, Paytm), Crypto USDT/BTC'],
      ['Outbound Payouts', 'Crypto USDT (TRC-20, ERC-20), Direct International Bank Wire, UPI (India), PayPal'],
      ['Processing SLA', 'Disbursed within 4 hours following compliance and risk approval'],
      ['Fraud Detection', 'Cryptographic signature verification on webhooks & IP whitelist enforcement'],
    ];

    let ry = 295;
    for (const r of rails) {
      p7.addText(r[0] + ':', 55, ry, 'F2', 8.5, [0.15, 0.2, 0.3]);
      p7.addText(r[1], 180, ry, 'F1', 8, [0.25, 0.25, 0.25]);
      ry -= 28;
    }

    pages.push(p7);

    // =========================================================================
    // PAGE 8: SUPPORT DESK, ADMIN CONTROLS & SECURITY
    // =========================================================================
    const p8 = new PDFPage();
    addHeaderFooter(p8, 8, 8, 'Support Desk & Admin Operations');

    p8.addText('7. Support Desk, Admin Controls & Operational Standards', 45, 730, 'F2', 15, [0.1, 0.15, 0.25]);
    p8.addLine(45, 722, 565, 722, [0.85, 0.70, 0.20], 1.5);

    p8.addText('FundedShift incorporates a centralized ticketing helpdesk and an enterprise administrative command suite.', 45, 706, 'F1', 9.5);
    p8.addText('All administrative changes, role elevations, and payouts are logged in permanent audit trails.', 45, 693, 'F1', 9.5);

    // Support Desk Card
    p8.addRect(45, 530, 520, 145, [0.97, 0.98, 1.0], [0.2, 0.4, 0.8], 1);
    p8.addText('REAL-TIME HELPDESK & TICKETING DESK', 55, 660, 'F2', 10, [0.1, 0.25, 0.6]);

    p8.addText('1. Trader Support (/dashboard/support):', 55, 642, 'F2', 8.5, [0.2, 0.2, 0.2]);
    p8.addText('   Categorized ticket generation: Trading & Rules, Billing, Verification, Payouts, Technical, General.', 55, 630, 'F1', 8);
    p8.addText('   Interactive conversation thread: Traders receive real-time answers and reply back directly.', 55, 618, 'F1', 8);

    p8.addText('2. Admin Support Helpdesk (/admin/support):', 55, 602, 'F2', 8.5, [0.2, 0.2, 0.2]);
    p8.addText('   Metric Cards: Total Tickets, Open Tickets, In Progress, Resolved.', 55, 590, 'F1', 8);
    p8.addText('   Split-pane workstation: Live queue filtering with search, status toggles, and direct reply dispatcher.', 55, 578, 'F1', 8);
    p8.addText('   Automated Notifications: Dispatching an admin reply triggers an instant trader in-app notification.', 55, 566, 'F1', 8);
    p8.addText('   Ticket Lifecycle: open -> in_progress (on admin reply) -> resolved.', 55, 554, 'F1', 8);

    // Admin Control Suite
    p8.addText('ENTERPRISE ADMINISTRATIVE CONTROL SUITE', 45, 510, 'F2', 10.5, [0.85, 0.65, 0.15]);
    p8.addRect(45, 345, 520, 155, [0.99, 0.98, 0.95], [0.85, 0.6, 0.1], 1);

    const adminModules = [
      ['Users (/admin/users)', 'View all registered traders, toggle User <-> Admin roles, suspend/activate accounts.'],
      ['Challenges (/admin/challenges)', 'Adjust challenge prices, profit targets, drawdown models, and add new tiers.'],
      ['Payouts (/admin/payouts)', 'Review profit split requests, inspect trade history, approve/reject disbursements.'],
      ['KYC Desk (/admin/kyc)', 'Examine identity documents, verify compliance, clear traders for withdrawals.'],
      ['Coupons (/admin/coupons)', 'Issue marketing promo codes, configure percentage/fixed discounts, monitor usage.'],
      ['Affiliates (/admin/affiliates)', 'Track referral conversion rates, manage 10-15% commission payouts to partners.'],
    ];

    let my = 482;
    for (const m of adminModules) {
      p8.addText(m[0], 55, my, 'F2', 8, [0.75, 0.45, 0.05]);
      p8.addText(m[1], 200, my, 'F1', 7.5, [0.25, 0.25, 0.25]);
      my -= 23;
    }

    // Security & Compliance Standards Box
    p8.addText('SECURITY INFRASTRUCTURE & PRODUCTION DEPLOYMENT', 45, 325, 'F2', 10.5, [0.85, 0.65, 0.15]);
    p8.addRect(45, 175, 520, 140, [0.96, 0.98, 0.97], [0.2, 0.6, 0.3], 1);

    p8.addText('1. Password Hashing: PBKDF2 with SHA-512 and unique salt (fundedshift_salt_2026), 1,000 rounds.', 55, 296, 'F1', 8);
    p8.addText('2. JWT Authorization: HS256 tokens with strict role expiration and secret key signing.', 55, 282, 'F1', 8);
    p8.addText('3. Docker Containerization: Isolated app and postgres:16-alpine containers with health check loops.', 55, 268, 'F1', 8);
    p8.addText('4. Zero Mock Policy: Platform strictly decoupled from mock fallbacks; clean empty states for new traders.', 55, 254, 'F1', 8);
    p8.addText('5. Audit Trail Immutability: All administrative overrides write permanent records to audit_logs.', 55, 240, 'F1', 8);
    p8.addText('6. Compliance Readiness: Strict adherence to proprietary trading rules, AML/KYC guidelines, and risk controls.', 55, 226, 'F1', 8);

    pages.push(p8);

    // =========================================================================
    // COMPILE RAW PDF 1.4 FILE WITH EXACT XREF OFFSETS
    // =========================================================================
    const totalPages = pages.length;

    // Numbering:
    // Obj 1: Catalog
    // Obj 2: Pages
    // Obj 3: Font F1 (Helvetica)
    // Obj 4: Font F2 (Helvetica-Bold)
    // Obj 5: Font F3 (Courier)
    // Obj 6: Font F4 (Courier-Bold)
    // Page objects: Obj 7, 9, 11, ...
    // Stream objects: Obj 8, 10, 12, ...

    const FONT_F1_OBJ = 3;
    const FONT_F2_OBJ = 4;
    const FONT_F3_OBJ = 5;
    const FONT_F4_OBJ = 6;

    const pageObjStart = 7;
    const pageKids: string[] = [];

    for (let i = 0; i < totalPages; i++) {
      const pageNum = pageObjStart + i * 2;
      pageKids.push(`${pageNum} 0 R`);
    }

    const objects: { id: number; data: string }[] = [];

    // 1. Catalog
    objects.push({
      id: 1,
      data: '<< /Type /Catalog /Pages 2 0 R >>',
    });

    // 2. Pages
    objects.push({
      id: 2,
      data: `<< /Type /Pages /Kids [${pageKids.join(' ')}] /Count ${totalPages} >>`,
    });

    // Fonts
    objects.push({
      id: FONT_F1_OBJ,
      data: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    });
    objects.push({
      id: FONT_F2_OBJ,
      data: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    });
    objects.push({
      id: FONT_F3_OBJ,
      data: '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>',
    });
    objects.push({
      id: FONT_F4_OBJ,
      data: '<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>',
    });

    // Pages & Streams
    for (let i = 0; i < totalPages; i++) {
      const pageObjId = pageObjStart + i * 2;
      const streamObjId = pageObjId + 1;
      const streamContent = pages[i].compileStream();
      const streamLen = Buffer.byteLength(streamContent, 'utf-8');

      // Page Object
      objects.push({
        id: pageObjId,
        data: `<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 ${FONT_F1_OBJ} 0 R /F2 ${FONT_F2_OBJ} 0 R /F3 ${FONT_F3_OBJ} 0 R /F4 ${FONT_F4_OBJ} 0 R >> >> /MediaBox [0 0 612 792] /Contents ${streamObjId} 0 R >>`,
      });

      // Stream Object
      objects.push({
        id: streamObjId,
        data: `<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream`,
      });
    }

    // Sort objects by ID
    objects.sort((a, b) => a.id - b.id);

    // Build PDF buffer
    let out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets: number[] = [0]; // obj 0 offset is 0

    for (const obj of objects) {
      const currentOffset = Buffer.byteLength(out, 'binary');
      offsets[obj.id] = currentOffset;
      out += `${obj.id} 0 obj\n${obj.data}\nendobj\n`;
    }

    const startXref = Buffer.byteLength(out, 'binary');
    const totalObjsCount = objects.length + 1;

    out += `xref\n0 ${totalObjsCount}\n`;
    out += '0000000000 65535 f \n';

    for (let id = 1; id < totalObjsCount; id++) {
      const off = offsets[id] || 0;
      const padded = off.toString().padStart(10, '0');
      out += `${padded} 00000 n \n`;
    }

    out += `trailer\n<< /Size ${totalObjsCount} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

    return Buffer.from(out, 'binary');
  }

  public static saveToFile(outputPath?: string): string {
    const dest = outputPath || path.join(process.cwd(), 'FundedShift_Architecture_Guide.pdf');
    const buf = this.generateDocument();
    fs.writeFileSync(dest, buf);
    return dest;
  }
}
