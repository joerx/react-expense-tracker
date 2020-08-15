import React, { useContext } from "react";
import { GlobalContext } from "../context/GlobalState";

const sum = (acc, item) => acc + item;

export const IncomeExpenses = () => {
  const { transactions } = useContext(GlobalContext);
  const amounts = transactions.map((t) => t.amount);

  const income = amounts.filter((item) => item >= 0).reduce(sum, 0);
  const expense = amounts.filter((item) => item < 0).reduce(sum, 0);

  return (
    <div className="inc-exp-container">
      <div>
        <h4>Income</h4>
        <p className="money plus">+${income.toFixed(2)}</p>
      </div>
      <div>
        <h4>Expense</h4>
        <p className="money minus">-${Math.abs(expense).toFixed(2)}</p>
      </div>
    </div>
  );
};
