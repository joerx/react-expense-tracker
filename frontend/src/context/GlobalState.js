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

  const getTransactions = async () => {
    try {
      const res = await axios.get("/api/v1/transactions");
      const payload = res.data.transactions;
      dispatch({ type: "GET_TRANSACTIONS", payload });
    } catch (error) {
      dispatch({ type: "FETCH_ERROR", payload: error.response.data.messages });
    }
  };

  const deleteTransaction = (transaction) => {
    dispatch({
      type: "DELETE_TRANSACTION",
      payload: transaction,
    });
  };

  const addTransaction = (transaction) => {
    dispatch({
      type: "ADD_TRANSACTION",
      payload: transaction,
    });
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
