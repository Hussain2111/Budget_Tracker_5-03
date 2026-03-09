import { useState } from "react";
import { Card, Select, Button, message, Space, Divider } from "antd";
import { useCurrency } from "../CurrencyContext";
import { authService } from "../services/apiService";

const Settings = () => {
  const { baseCurrency, currencies, updateBaseCurrency, isLoading } = useCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState(baseCurrency.code);
  const [saving, setSaving] = useState(false);

  const currencyOptions = Object.values(currencies).map(currency => ({
    label: `${currency.symbol} ${currency.code} - ${currency.name}`,
    value: currency.code,
  }));

  const handleSave = async () => {
    if (selectedCurrency === baseCurrency.code) {
      message.info("No changes to save");
      return;
    }

    try {
      setSaving(true);
      await updateBaseCurrency(selectedCurrency);
      message.success(`Base currency updated to ${selectedCurrency}`);
    } catch (error) {
      message.error("Failed to update base currency. Please try again.");
      console.error("Failed to update base currency:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedCurrency(baseCurrency.code);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-title">Settings</div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <Card title="Base Currency" style={{ marginBottom: 24 }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
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
            </div>

            <div style={{ 
              padding: "12px 16px", 
              backgroundColor: "#f5f5f5", 
              borderRadius: 6,
              fontSize: 13,
              color: "#666",
              lineHeight: 1.5
            }}>
              <strong>Note:</strong> Changing your base currency recalculates all totals using 
              exchange rates recorded at the time each transaction was entered. 
              Individual transaction amounts remain unchanged.
            </div>

            <Space>
              <Button
                type="primary"
                onClick={handleSave}
                loading={saving || isLoading}
                disabled={selectedCurrency === baseCurrency.code}
              >
                Save Changes
              </Button>
              <Button onClick={handleReset} disabled={saving || isLoading}>
                Reset
              </Button>
            </Space>
          </Space>
        </Card>

        <Card title="About">
          <Space direction="vertical" size="small">
            <div><strong>Current Base Currency:</strong> {baseCurrency.symbol} {baseCurrency.code} - {baseCurrency.name}</div>
            <div><strong>Supported Currencies:</strong> {Object.keys(currencies).length} currencies</div>
            <div><strong>Exchange Rate Updates:</strong> Rates are fetched when adding transactions in foreign currencies and cached for 1 hour</div>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
