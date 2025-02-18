import React, { useState, FormEvent } from "react";
import "./App.css";

interface AdditionalExpense {
  description: string;
  amount: number;
}

interface PaymentCycle {
  receivedMoney: number;
  expenses: AdditionalExpense[];
  debtPayment: number;
  freeMoney: number;
  dateRange: string;
}

const getCycleRangeAndNext = (
  start: Date
): { range: string; nextStart: Date } => {
  const year = start.getFullYear();
  const month = start.getMonth();
  const day = start.getDate();
  let range: string;
  let nextStart: Date;
  const monthName = start.toLocaleString("default", { month: "short" });

  if (day === 1) {
    range = `1-15 ${monthName}`;
    nextStart = new Date(year, month, 16);
  } else if (day === 16) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    range = `16-${lastDay} ${monthName}`;
    nextStart = new Date(year, month + 1, 1);
  } else {
    if (day < 15) {
      range = `1-15 ${monthName}`;
      nextStart = new Date(year, month, 16);
    } else {
      const lastDay = new Date(year, month + 1, 0).getDate();
      range = `16-${lastDay} ${monthName}`;
      nextStart = new Date(year, month + 1, 1);
    }
  }
  return { range, nextStart };
};

const App: React.FC = () => {
  const [debt, setDebt] = useState<number | null>(null);
  const [cycles, setCycles] = useState<PaymentCycle[]>([]);
  const [showDebtDialog, setShowDebtDialog] = useState<boolean>(true);
  const [showCycleDialog, setShowCycleDialog] = useState<boolean>(false);

  const today = new Date();
  const initialCycleStart =
    today.getDate() <= 15
      ? new Date(today.getFullYear(), today.getMonth(), 1)
      : new Date(today.getFullYear(), today.getMonth(), 16);
  const [nextCycleStart, setNextCycleStart] = useState<Date>(initialCycleStart);

  const handleDebtSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const debtValue = formData.get("debt");
    if (debtValue) {
      const currentDebt = parseFloat(debtValue.toString());
      if (!isNaN(currentDebt) && currentDebt > 0) {
        setDebt(currentDebt);
        setShowDebtDialog(false);
      } else {
        alert("Please enter a valid debt amount");
      }
    }
  };

  const addCycle = (cycle: PaymentCycle) => {
    setCycles([...cycles, cycle]);
    setDebt((prevDebt) => (prevDebt !== null ? prevDebt - cycle.debtPayment : 0));
    setNextCycleStart((prev) => getCycleRangeAndNext(prev).nextStart);
  };

  return (
    <div className="App">
      {showDebtDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>Enter Current Debt</h2>
            <form onSubmit={handleDebtSubmit}>
              <input
                type="number"
                name="debt"
                placeholder="Enter debt amount"
                required
              />
              <button type="submit">Submit Debt</button>
            </form>
          </div>
        </div>
      )}

      {!showDebtDialog && (
        <div className="app-container">
          <div className="left-panel">
            <h1>Debt Payment Tracker</h1>
            <h2>
              Current Debt:{" "}
              {debt !== null ? debt.toLocaleString() : "N/A"}
            </h2>
            <button onClick={() => setShowCycleDialog(true)}>
              Add Payment Cycle
            </button>
          </div>
          <div className="right-panel">
            <div className="canvas">
              {cycles.length === 0 && <p>No cycles added yet.</p>}
              {cycles.map((cycle, index) => (
                <div key={index} className="cycle-card">
                  <h4>{cycle.dateRange}</h4>
                  <p>
                    Received: {cycle.receivedMoney.toLocaleString()}
                  </p>
                  {cycle.expenses.length > 0 && (
                    <div>
                      <p>Expenses:</p>
                      <ul>
                        {cycle.expenses.map((exp, i) => (
                          <li key={i}>
                            {exp.description}: {exp.amount.toLocaleString()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p>Free Money: {cycle.freeMoney.toLocaleString()}</p>
                  <p>
                    Debt Payment: {cycle.debtPayment.toLocaleString()}
                  </p>
                  <p>
                    Remaining Free Money:{" "}
                    {(cycle.freeMoney - cycle.debtPayment).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCycleDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <PaymentCycleForm
              addCycle={addCycle}
              onClose={() => setShowCycleDialog(false)}
              cycleStart={nextCycleStart}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface PaymentCycleFormProps {
  addCycle: (cycle: PaymentCycle) => void;
  onClose: () => void;
  cycleStart: Date;
}

const PaymentCycleForm: React.FC<PaymentCycleFormProps> = ({
  addCycle,
  onClose,
  cycleStart,
}) => {
  const [receivedMoney, setReceivedMoney] = useState<string>("");
  const [debtPayment, setDebtPayment] = useState<string>("");

  const [expenses, setExpenses] = useState<{ description: string; amount: string }[]>([
    { description: "", amount: "" },
  ]);

  const addExpenseRow = () => {
    setExpenses([...expenses, { description: "", amount: "" }]);
  };

  const updateExpenseRow = (
    index: number,
    field: "description" | "amount",
    value: string
  ) => {
    const updated = expenses.map((exp, i) =>
      i === index ? { ...exp, [field]: value } : exp
    );
    setExpenses(updated);
  };

  const removeExpenseRow = (index: number) => {
    if (index === 0) return;
    const updated = expenses.filter((_, i) => i !== index);
    setExpenses(updated);
  };

  const received = parseFloat(receivedMoney) || 0;
  const totalExpenses = expenses.reduce(
    (sum, exp) => sum + (parseFloat(exp.amount) || 0),
    0
  );
  const computedFreeMoney = received - totalExpenses;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const debtPay = parseFloat(debtPayment) || 0;

    if (computedFreeMoney < 0) {
      alert("Expenses exceed received money!");
      return;
    }
    if (debtPay > computedFreeMoney) {
      alert("Debt payment cannot exceed free money available!");
      return;
    }

    const { range } = getCycleRangeAndNext(cycleStart);

    const cycle: PaymentCycle = {
      receivedMoney: received,
      expenses: expenses.map((exp) => ({
        description: exp.description,
        amount: parseFloat(exp.amount) || 0,
      })),
      debtPayment: debtPay,
      freeMoney: computedFreeMoney,
      dateRange: range,
    };

    addCycle(cycle);
    onClose();

    setReceivedMoney("");
    setDebtPayment("");
    setExpenses([{ description: "", amount: "" }]);
  };

  const { range } = getCycleRangeAndNext(cycleStart);

  return (
    <div>
      <h2>Enter Payment Cycle Details</h2>
      <p>
        <strong>Cycle Date Range:</strong> {range}
      </p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Received Money: </label>
          <input
            type="number"
            value={receivedMoney}
            onChange={(e) => setReceivedMoney(e.target.value)}
            required
          />
        </div>
        <div>
          <h3>Expenses</h3>
          {expenses.map((exp, index) => (
            <div key={index} style={{ marginBottom: "10px" }}>
              <input
                type="text"
                placeholder={index === 0 ? "Expense 1 Description" : "Description"}
                value={exp.description}
                onChange={(e) =>
                  updateExpenseRow(index, "description", e.target.value)
                }
                required
              />
              <input
                type="number"
                placeholder="Amount"
                value={exp.amount}
                onChange={(e) => updateExpenseRow(index, "amount", e.target.value)}
                required
              />
              {index > 0 && (
                <button type="button" onClick={() => removeExpenseRow(index)}>
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addExpenseRow}>
            Add Expense
          </button>
        </div>
        <p>
          <strong>Free Money Available:</strong>{" "}
          {computedFreeMoney.toLocaleString()}
        </p>
        <div>
          <label>Debt Payment: </label>
          <input
            type="number"
            value={debtPayment}
            onChange={(e) => setDebtPayment(e.target.value)}
            required
          />
        </div>
        <button type="submit">Submit Cycle</button>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </form>
    </div>
  );
};


export default App;
