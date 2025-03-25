import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Generates a well-formatted PDF of transaction history for a given account number.
 */
export const exportTransactionHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accNo } = req.params;

    // Fetch transactions where the account is either sender or receiver
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ senderAccNo: accNo }, { receiverAccNo: accNo }],
      },
      orderBy: { timestamp: "desc" },
    });

    if (!transactions.length) {
      res.status(404).json({ error: "No transactions found" });
      return;
    }

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="transaction-history_${accNo}.pdf"`);

    // Create PDF document with margins
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Load a font that supports ₹ symbol (Unicode)
    doc.font("Helvetica");

    // 📌 Title
    doc
      .fontSize(18)
      .text("Transaction History", { align: "center" })
      .moveDown();

    doc
      .fontSize(14)
      .text(`Account Number: ${accNo}`, { align: "center" })
      .moveDown(2);

    // 📌 Table Headers
    const tableTop = doc.y;
    const columnWidths = [100, 120, 100, 200];
    const columnTitles = ["Date", "Type", "Amount", "Description"];

    doc.font("Helvetica-Bold").fontSize(12);
    
    columnTitles.forEach((title, i) => {
      doc.text(title, 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop, {
        width: columnWidths[i],
        align: "left",
      });
    });

    doc.moveDown(0.5);

    // 📌 Draw line under header
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Reset font for table content
    doc.font("Helvetica").fontSize(10);

    // Fixed row height for consistent spacing
    let rowY = doc.y;
    const rowHeight = 20;

    transactions.forEach((txn) => {
      if (rowY + rowHeight > 750) { // Handle page break
        doc.addPage();
        rowY = 50;

        // Redraw headers on new page
        doc.font("Helvetica-Bold").fontSize(12);
        columnTitles.forEach((title, i) => {
          doc.text(title, 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), rowY, {
            width: columnWidths[i],
            align: "left",
          });
        });

        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        rowY = doc.y;
        doc.font("Helvetica").fontSize(10);
      }

      const values = [
        new Date(txn.timestamp).toLocaleDateString(),
        txn.transactionType,
        `${txn.amount.toFixed(2)}`,
        txn.description || "N/A",
      ];

      values.forEach((value, i) => {
        doc.text(value, 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), rowY, {
          width: columnWidths[i],
          align: "left",
        });
      });

      rowY += rowHeight;
      doc.moveDown(0.2);
    });

    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};
