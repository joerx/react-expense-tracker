import React, { createContext, useReducer } from "react";
import AppReducer from "./AppReducer";
import axios from "axios";

// Initial state
const initialState = {
  transactions: [],
  errors: [],
  loading: true,
};

export const GlobalContext = createContext(initialState);

export const GlobalProvider = ({ children }) => {
  const [state, dispatch] = useReducer(AppReducer, initialState);

  const _handleError = (error) => {
    dispatch({
      type: "TRANSACTION_ERROR",
      payload: error.response.data.messages,
    });
  };

  const getTransactions = async () => {
    try {
      const res = await axios.get("/api/v1/transactions");
      const payload = res.data.transactions;
      dispatch({ type: "GET_TRANSACTIONS", payload });
    } catch (error) {
      _handleError(error);
    }
  };

  const deleteTransaction = async (transaction) => {
    try {
      await axios.delete(`/api/v1/transactions/${transaction.id}`);
      dispatch({
        type: "DELETE_TRANSACTION",
        payload: transaction,
      });
    } catch (error) {
      _handleError(error);
    }
  };

  const addTransaction = async (transaction) => {
    const config = { headers: { "Content-type": "application/json" } };

    try {
      const res = await axios.post("/api/v1/transactions", transaction, config);
      dispatch({
        type: "ADD_TRANSACTION",
        payload: res.data.transaction,
      });
    } catch (error) {
      _handleError(error);
    }
  };

  return (
    <GlobalContext.Provider
      value={{
        transactions: state.transactions,
        error: state.error,
        loading: state.loading,
        deleteTransaction,
        addTransaction,
        getTransactions,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
