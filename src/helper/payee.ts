import { PrismaClient, CustomerType } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

interface PayeeRequestBody {
  name: string;
  payeeifsc: string;
  payeeAccNo: string;
  payerCustomerId: string;
  payeeCustomerId: string;
  payeeType: CustomerType;
}

interface RequestParams {
  payerCustomerId: string;
}

// working well
export const AddPayee = async (
  req: Request<RequestParams, {}, PayeeRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const { name, payeeifsc, payeeAccNo, payeeType } = req.body;
    const { payerCustomerId } = req.params;

    const accountExists = await prisma.account.findUnique({
      where: {
        accNo: payeeAccNo,
      },
    });

    if (!accountExists) {
      res.status(404).json({
        error: "Account does not exist",
      });
      return;
    }

    // Get the customer ID associated with the account
    const payeeCustomerId = accountExists.customerId;
    const ifsc = accountExists.ifsc;

    const AlreadyPayeeExists = await prisma.payee.findFirst({
      where: {
        payeeCustomerId: payeeCustomerId,
        payerCustomerId: payerCustomerId,
      },
    });

    if (AlreadyPayeeExists) {
      res.status(409).json({ error: "Payee already exists for this payer" });
      return;
    }

    if (payeeifsc !== ifsc) {
      res
        .status(400)
        .json({ error: "Provided IFSC does not match the account's IFSC" });
      return;
    }

    // Create the payee
    const payee = await prisma.payee.create({
      data: {
        name,
        payeeAccNo,
        payeeType,
        payeeifsc,
        payeeCustomerId,
        payerCustomerId,
      },
    });

    res.status(201).json(payee);
  } catch (error) {
    console.error("Error creating payee:", error);
    res.status(500).json({
      error: "Failed to create payee",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// working well
export const fetchPayee = async (
  req: Request<RequestParams, {}, PayeeRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const { payerCustomerId } = req.params;
    const payees = await prisma.payee.findMany({
      where: {
        payerCustomerId,
      },
    });

    res.status(200).json(payees);
  } catch (error) {
    console.error("Error fetch payee:", error);
    res.status(500).json({
      error: "Failed to fetch payee",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }
};

// working well
export const EditPayee = async (
  req: Request<RequestParams, {}, PayeeRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const { name, payeeifsc, payeeAccNo, payeeType } = req.body;
    const { payerCustomerId } = req.params;

    // Check if the account exists
    const accountExists = await prisma.account.findUnique({
      where: {
        accNo: payeeAccNo,
      },
    });

    if (!accountExists) {
      res.status(404).json({
        error: "Account does not exist",
      });
      return;
    }

    // Get the payee's customer ID from the account
    const payeeCustomerId = accountExists.customerId;
    const ifsc = accountExists.ifsc;

    // Validate IFSC
    if (payeeifsc !== ifsc) {
      res
        .status(400)
        .json({ error: "Provided IFSC does not match the account's IFSC" });
      return;
    }

    // Ensure the payee exists for this payer
    const existingPayee = await prisma.payee.findFirst({
      where: {
        payerCustomerId,
        payeeCustomerId,
      },
    });

    if (!existingPayee) {
      res.status(404).json({ error: "Payee not found for this payer" });
      return;
    }

    // Update the payee details
    const updatedPayee = await prisma.payee.update({
      where: {
        id: existingPayee.id, // Ensure we update the correct payee
      },
      data: {
        name,
        payeeType,
      },
    });

    res.status(200).json(updatedPayee);
  } catch (error) {
    console.error("Error Editing Payee:", error);
    res.status(500).json({
      error: "Failed to edit payee",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// working well
export const deletePayee = async (
  req: Request<RequestParams, {}, PayeeRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const { name, payeeifsc, payeeAccNo, payeeType } = req.body;
    const { payerCustomerId } = req.params;

    // Check if the account exists
    const accountExists = await prisma.account.findUnique({
      where: {
        accNo: payeeAccNo,
      },
    });

    if (!accountExists) {
      res.status(404).json({
        error: "Account does not exist",
      });
      return;
    }

    // Get the payee's customer ID from the account
    const payeeCustomerId = accountExists.customerId;
    const ifsc = accountExists.ifsc;

    // Validate IFSC
    if (payeeifsc !== ifsc) {
      res
        .status(400)
        .json({ error: "Provided IFSC does not match the account's IFSC" });
      return;
    }

    // Ensure the payee exists for this payer
    const existingPayee = await prisma.payee.findFirst({
      where: {
        payerCustomerId,
        payeeCustomerId,
      },
    });

    if (!existingPayee) {
      res.status(404).json({ error: "Payee not found for this payer" });
      return;
    }

    // Update the payee details
    const deletePayee = await prisma.payee.delete({
      where: {
        id: existingPayee.id,
        payerCustomerId,
        payeeCustomerId,
      },
    });

    res.status(200).json({
      deletePayee,
      message: "Payee deleted successfully",
    });
  } catch (error) {
    console.error("Error Deleting Payee:", error);
    res.status(500).json({
      error: "Failed to Delete payee",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// working well
export const CheckPayeeName = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { payeeifsc, payeeAccNo } = req.body;
    const account = await prisma.account.findUnique({
      where: {
        ifsc: payeeifsc,
        accNo: payeeAccNo,
      },
      include: {
        customer: true,
      },
    });

    if (!account) {
      res.status(404).json({
        error: "Account does not exist",
      });
      return;
    }

    res.status(200).json({
      customerName: account.customer.name,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to Find Name of payee",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
