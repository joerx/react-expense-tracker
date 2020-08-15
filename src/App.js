import React from "react";
import "./App.css";
import { IncomeExpenses } from "./components/IncomeExpenses";
import { Balance } from "./components/Balance";
import { Header } from "./components/Header";
import { TransactionList } from "./components/TransactionList";
import { AddTransaction } from "./components/AddTransaction";

function App() {
  return (
    <div>
      <Header />
      <div className="container">
        <Balance />
        <IncomeExpenses />
        <TransactionList />
        <AddTransaction />
      </div>
    </div>
  );
}

export default App;
