import {
  createRecurringPayment,
  getRecurringPayments,
  cancelRecurringPayment
} from "../recurring/recurringService.js";

export const createRecurringController = async (req, res) => {
  const { amount, address, frequency } = req.body;

  const result = await createRecurringPayment(amount, address, frequency);

  if (result.success) {
    return res.status(201).json(result);
  }

  return res.status(400).json(result);
};

export const getRecurringController = (req, res) => {
  return res.json(getRecurringPayments());
};

export const cancelRecurringController = (req, res) => {
  const { id } = req.params;
  const result = cancelRecurringPayment(id);

  if (result.success) {
    return res.json(result);
  }

  return res.status(404).json(result);
};
