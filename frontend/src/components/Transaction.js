import React, { useContext } from "react";
import { GlobalContext } from "../context/GlobalState";

export const Transaction = ({ transaction }) => {
  const { deleteTransaction } = useContext(GlobalContext);

  const sign = transaction.amount >= 0 ? "+" : "-";
  const clz = transaction.amount >= 0 ? "plus" : "minus";

  return (
    <li key={transaction.id} className={clz}>
      {transaction.text}{" "}
      <span>
        {sign}${Math.abs(transaction.amount)}
      </span>
      <button
        className="delete-btn"
        onClick={() => deleteTransaction(transaction)}
      >
        x
      </button>
    </li>
  );
};
