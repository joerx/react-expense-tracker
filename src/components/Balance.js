import React, { useContext } from "react";
import { GlobalContext } from "../context/GlobalState";

export const Balance = () => {
  const { transactions } = useContext(GlobalContext);

  const amounts = transactions.map((t) => t.amount);
  const total = amounts.reduce((acc, item) => acc + item, 0);

  return (
    <>
      <h4>Your Balance</h4>
      <h1>${total.toFixed(2)}</h1>
    </>
  );
};
