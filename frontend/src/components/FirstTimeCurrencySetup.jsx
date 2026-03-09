import { useState, useEffect } from "react";
import { Modal, Select, Button, message } from "antd";
import { useCurrency } from "../CurrencyContext";

const FirstTimeCurrencySetup = () => {
  const { baseCurrency, currencies, updateBaseCurrency, isLoading } = useCurrency();
  const [visible, setVisible] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(baseCurrency.code);
  const [hasShownBefore, setHasShownBefore] = useState(false);

  const currencyOptions = Object.values(currencies).map(currency => ({
    label: `${currency.symbol} ${currency.code} - ${currency.name}`,
    value: currency.code,
  }));

  useEffect(() => {
    // Check if user has already seen this modal
    const shown = localStorage.getItem('currencySetupShown');
    if (!shown) {
      setVisible(true);
    }
  }, []);

  const handleSave = async () => {
    try {
      await updateBaseCurrency(selectedCurrency);
      localStorage.setItem('currencySetupShown', 'true');
      setVisible(false);
      message.success(`Base currency set to ${selectedCurrency}`);
    } catch (error) {
      message.error("Failed to set base currency. Please try again.");
    }
  };

  const handleSkip = () => {
    localStorage.setItem('currencySetupShown', 'true');
    setVisible(false);
  };

  return (
    <Modal
      title="Welcome to Multi-Currency Support!"
      open={visible}
      closable={false}
      maskClosable={false}
      footer={[
        <Button key="skip" onClick={handleSkip}>
          Use Default (USD)
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={handleSave}
          loading={isLoading}
          disabled={selectedCurrency === baseCurrency.code}
        >
          Set Currency
        </Button>
      ]}
      width={500}
    >
      <div style={{ marginBottom: 16 }}>
        <p>
          Your budget tracker now supports multiple currencies! Choose your preferred base currency 
          for displaying all totals and summaries.
        </p>
        <p style={{ marginBottom: 16 }}>
          <strong>Current selection:</strong> {baseCurrency.symbol} {baseCurrency.code} - {baseCurrency.name}
        </p>
      </div>
      
      <Select
        value={selectedCurrency}
        onChange={setSelectedCurrency}
        options={currencyOptions}
        style={{ width: "100%" }}
        showSearch
        filterOption={(input, option) =>
          option.label.toLowerCase().includes(input.toLowerCase())
        }
        placeholder="Select your base currency"
      />
      
      <div style={{ 
        marginTop: 16, 
        padding: "12px 16px", 
        backgroundColor: "#f5f5f5", 
        borderRadius: 6,
        fontSize: 13,
        color: "#666",
        lineHeight: 1.5
      }}>
        <strong>Note:</strong> You can always change this later in Settings. 
        All existing transactions will be converted using their stored exchange rates.
      </div>
    </Modal>
  );
};

export default FirstTimeCurrencySetup;
