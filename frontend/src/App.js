import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import "@/App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";
import {
  Settings,
  Plus,
  Trash2,
  ExternalLink,
  Download,
  LogOut,
  RotateCcw,
  Check,
  X,
  ChevronDown,
  Edit3,
  ShoppingBag,
  Users,
  Receipt,
  CreditCard,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Switch } from "./components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { ScrollArea } from "./components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import { Checkbox } from "./components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Format price in EUR (nl-NL)
const formatPrice = (price) => {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(price);
};

// Parse User-Agent to get device/browser info
const parseDeviceInfo = (userAgent) => {
  if (!userAgent) return { device: "Onbekend", browser: "Onbekend" };
  
  // Detect device type
  let device = "Desktop";
  if (/iPhone/i.test(userAgent)) device = "iPhone";
  else if (/iPad/i.test(userAgent)) device = "iPad";
  else if (/Android/i.test(userAgent) && /Mobile/i.test(userAgent)) device = "Android Phone";
  else if (/Android/i.test(userAgent)) device = "Android Tablet";
  else if (/Macintosh/i.test(userAgent)) device = "Mac";
  else if (/Windows/i.test(userAgent)) device = "Windows PC";
  else if (/Linux/i.test(userAgent)) device = "Linux";
  
  // Detect browser
  let browser = "Onbekend";
  if (/Edg\//i.test(userAgent)) browser = "Edge";
  else if (/Chrome/i.test(userAgent) && !/Chromium/i.test(userAgent)) browser = "Chrome";
  else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = "Safari";
  else if (/Firefox/i.test(userAgent)) browser = "Firefox";
  else if (/Opera|OPR/i.test(userAgent)) browser = "Opera";
  
  return { device, browser };
};

// Category order for display
const CATEGORY_ORDER = [
  "SNACKS",
  "PATAT",
  "PATAT SPECIALS",
  "BURGERS",
  "VIS SNACKS",
  "KIP SNACKS",
  "VEGA/VEGAN SNACKS",
  "HUISGEMAAKTE SNACKS",
  "STOKBROOD",
  "LUNCH",
  "VOORGERECHT",
  "VIS PLATE",
  "VLEES PLATE",
  "VEGETARISCH PLATE",
  "DESSERTS",
  "KOFFIE NA",
  "KIDS BOX",
  "EXTRA",
  "SAUS",
  "DRANKEN",
];

function App() {
  // State
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState({ payment_link: "", is_edit_mode: false });
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [currentOrderItems, setCurrentOrderItems] = useState([
    { menu_item_id: "", name: "", quantity: 1, price: 0 },
  ]);

  // UI state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [tempPaymentLink, setTempPaymentLink] = useState("");
  const [isLogVisible, setIsLogVisible] = useState(false);
  const [isResetConfirmVisible, setIsResetConfirmVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Fetch data on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [menuRes, ordersRes, settingsRes, logRes] = await Promise.all([
        axios.get(`${API}/menu`),
        axios.get(`${API}/orders`),
        axios.get(`${API}/settings`),
        axios.get(`${API}/activity-log`),
      ]);
      setMenu(menuRes.data);
      setOrders(ordersRes.data);
      setSettings(settingsRes.data);
      setTempPaymentLink(settingsRes.data.payment_link || "");
      setActivityLog(logRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Fout bij laden van gegevens");
    } finally {
      setLoading(false);
    }
  };

  // Group menu by category
  const menuByCategory = useMemo(() => {
    const grouped = {};
    menu.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    // Sort by category order
    const sorted = {};
    CATEGORY_ORDER.forEach((cat) => {
      if (grouped[cat]) {
        sorted[cat] = grouped[cat].sort((a, b) => a.name.localeCompare(b.name));
      }
    });
    return sorted;
  }, [menu]);

  // Calculate total overview
  const totalOverview = useMemo(() => {
    const overview = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!overview[item.name]) {
          overview[item.name] = { quantity: 0, price: item.price };
        }
        overview[item.name].quantity += item.quantity;
      });
    });
    return Object.entries(overview)
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        subtotal: data.quantity * data.price,
      }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [orders]);

  // Calculate grand total
  const grandTotal = useMemo(() => {
    return orders.reduce((sum, order) => sum + order.total_price, 0);
  }, [orders]);

  // Log activity
  const logActivity = useCallback(async (action, details, orderId = null) => {
    try {
      const entry = {
        action,
        details,
        order_id: orderId,
        device_info: navigator.userAgent,
      };
      const res = await axios.post(`${API}/activity-log`, entry);
      setActivityLog((prev) => [res.data, ...prev]);
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  }, []);

  // Handle adding item to current order
  const handleAddItem = () => {
    setCurrentOrderItems([
      ...currentOrderItems,
      { menu_item_id: "", name: "", quantity: 1, price: 0 },
    ]);
  };

  // Handle item selection change
  const handleItemChange = (index, menuItemId) => {
    const menuItem = menu.find((m) => m.id === menuItemId);
    if (menuItem) {
      const updated = [...currentOrderItems];
      updated[index] = {
        menu_item_id: menuItem.id,
        name: menuItem.name,
        quantity: updated[index].quantity || 1,
        price: menuItem.price,
      };
      setCurrentOrderItems(updated);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (index, quantity) => {
    const updated = [...currentOrderItems];
    updated[index].quantity = Math.max(1, parseInt(quantity) || 1);
    setCurrentOrderItems(updated);
  };

  // Handle remove item from form
  const handleRemoveItem = (index) => {
    if (currentOrderItems.length > 1) {
      setCurrentOrderItems(currentOrderItems.filter((_, i) => i !== index));
    }
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!customerName.trim()) {
      toast.error("Vul alsjeblieft een naam in.");
      return;
    }

    const validItems = currentOrderItems.filter((item) => item.menu_item_id && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Voeg een geldige snack toe aan de bestelling.");
      return;
    }

    try {
      const orderData = {
        customer_name: customerName.trim(),
        items: validItems,
      };
      const res = await axios.post(`${API}/orders`, orderData);
      setOrders([...orders, res.data]);
      logActivity("Bestelling geplaatst", `${customerName} heeft besteld`, res.data.id);
      
      const nameLower = customerName.trim().toLowerCase();
      
      // Easter egg for Jilles
      if (nameLower === "jilles") {
        toast.success("Welkom terug, Snackkoning Jilles! 👑", {
          duration: 4000,
          style: {
            background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
            color: "#000",
            fontWeight: "bold",
          },
        });
      // Easter egg for Giorni
      } else if (nameLower === "giorni") {
        toast.success("Speknek, vind Esmee dat wel goed?! 🐷", {
          duration: 4000,
          style: {
            background: "linear-gradient(135deg, #FF69B4 0%, #FF1493 100%)",
            color: "#FFF",
            fontWeight: "bold",
          },
        });
      } else {
        toast.success(`Bestelling van ${customerName} is geplaatst!`);
      }

      // Reset form
      setCustomerName("");
      setCurrentOrderItems([{ menu_item_id: "", name: "", quantity: 1, price: 0 }]);
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Fout bij plaatsen van bestelling");
    }
  };

  // Handle payment status change
  const handlePaymentStatusChange = async (orderId, isPaid) => {
    try {
      const res = await axios.put(`${API}/orders/${orderId}`, { is_paid: isPaid });
      setOrders(orders.map((o) => (o.id === orderId ? res.data : o)));
      const order = orders.find((o) => o.id === orderId);
      logActivity(
        "Betaling gewijzigd",
        `${order.customer_name}: ${isPaid ? "Betaald" : "Niet betaald"}`,
        orderId
      );
      toast.success(`Betalingsstatus van ${order.customer_name} bijgewerkt`);
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Fout bij bijwerken betalingsstatus");
    }
  };

  // Handle update order item quantity (edit mode)
  const handleUpdateOrderItemQuantity = async (orderId, itemIndex, newQuantity) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const updatedItems = order.items.map((item, idx) =>
      idx === itemIndex ? { ...item, quantity: Math.max(0, newQuantity) } : item
    ).filter((item) => item.quantity > 0);

    if (updatedItems.length === 0) {
      // Delete entire order if no items left
      await handleDeleteOrder(orderId);
      return;
    }

    try {
      const res = await axios.put(`${API}/orders/${orderId}`, { items: updatedItems });
      setOrders(orders.map((o) => (o.id === orderId ? res.data : o)));
      logActivity("Item aangepast", `Aantal gewijzigd in bestelling van ${order.customer_name}`, orderId);
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Fout bij bijwerken bestelling");
    }
  };

  // Handle delete order item
  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    const { orderId, itemIndex, itemName, customerName: orderCustomerName } = itemToDelete;
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const updatedItems = order.items.filter((_, idx) => idx !== itemIndex);

    if (updatedItems.length === 0) {
      await handleDeleteOrder(orderId);
    } else {
      try {
        const res = await axios.put(`${API}/orders/${orderId}`, { items: updatedItems });
        setOrders(orders.map((o) => (o.id === orderId ? res.data : o)));
        logActivity("Item verwijderd", `${itemName} verwijderd uit bestelling van ${orderCustomerName}`, orderId);
        toast.success("Item verwijderd");
      } catch (error) {
        console.error("Error deleting item:", error);
        toast.error("Fout bij verwijderen item");
      }
    }
    setItemToDelete(null);
  };

  // Handle delete order
  const handleDeleteOrder = async (orderId) => {
    try {
      const order = orders.find((o) => o.id === orderId);
      await axios.delete(`${API}/orders/${orderId}`);
      setOrders(orders.filter((o) => o.id !== orderId));
      logActivity("Bestelling verwijderd", `Bestelling van ${order?.customer_name} verwijderd`, orderId);
      toast.success("Bestelling verwijderd");
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Fout bij verwijderen bestelling");
    }
  };

  // Admin login
  const handleAdminLogin = async () => {
    try {
      const res = await axios.post(`${API}/admin/verify`, { pin: adminCode });
      if (res.data.success) {
        setIsAdmin(true);
        logActivity("Admin login", "Admin ingelogd");
        toast.success("Admin ingelogd");
      } else {
        toast.error("Incorrecte code.");
      }
    } catch (error) {
      toast.error("Fout bij inloggen");
    }
    setAdminCode("");
  };

  // Admin logout
  const handleAdminLogout = () => {
    setIsAdmin(false);
    logActivity("Admin logout", "Admin uitgelogd");
    toast.success("Uitgelogd");
  };

  // Save payment link
  const handleSavePaymentLink = async () => {
    try {
      const res = await axios.put(`${API}/settings`, { payment_link: tempPaymentLink });
      setSettings(res.data);
      logActivity("Instellingen gewijzigd", "Betaalverzoek link bijgewerkt");
      toast.success("Link opgeslagen");
    } catch (error) {
      toast.error("Fout bij opslaan link");
    }
  };

  // Toggle edit mode
  const handleToggleEditMode = async () => {
    try {
      const res = await axios.put(`${API}/settings`, { is_edit_mode: !settings.is_edit_mode });
      setSettings(res.data);
    } catch (error) {
      toast.error("Fout bij wijzigen bewerkmodus");
    }
  };

  // Reset app
  const handleResetApp = async () => {
    try {
      await axios.post(`${API}/reset`);
      setOrders([]);
      logActivity("App gereset", "Alle bestellingen verwijderd");
      toast.success("App is gereset");
      setIsResetConfirmVisible(false);
    } catch (error) {
      toast.error("Fout bij resetten");
    }
  };

  // Export activity log to CSV
  const handleExportLog = () => {
    const headers = ["Timestamp", "Action", "Details", "Order ID", "Device Info", "IP Address"];
    const rows = activityLog.map((log) => [
      log.timestamp,
      log.action,
      log.details,
      log.order_id || "",
      log.device_info || "",
      log.client_ip || "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity_log_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to email
  const handleExportEmail = () => {
    const body = totalOverview
      .map((item) => `${item.quantity}x ${item.name} - ${formatPrice(item.subtotal)}`)
      .join("\n");
    const totalText = `\n\nTotaal: ${formatPrice(grandTotal)}`;
    const mailto = `mailto:info@cafetariarex.nl?subject=Bestelling P%26TA&body=${encodeURIComponent(body + totalText)}`;
    window.location.href = mailto;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-[#86868B]">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1C1C1E",
            color: "#F5F5F7",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white" data-testid="app-title">
              P&TA Snack Bestel App
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-sm text-[#86868B]">Voor de lekkerste kantoorlunch</p>
              <span className="text-[#6E6E73]">·</span>
              <a
                href="https://cafetariarex.nl/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#0A84FF] hover:text-[#0077ED] transition-colors"
                data-testid="rex-link"
              >
                cafetariarex.nl
              </a>
            </div>
          </div>

          <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-lg hover:bg-white/10"
                data-testid="settings-button"
              >
                <Settings className="h-5 w-5 text-[#86868B]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-72 bg-[#1C1C1E] border-white/10 text-white p-2"
            >
              {/* Edit Mode Toggle */}
              <div className="flex items-center justify-between px-2 py-2">
                <Label className="text-sm text-[#F5F5F7]">Bewerkmodus</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#86868B]">
                    {settings.is_edit_mode ? "Aan" : "Uit"}
                  </span>
                  <Switch
                    checked={settings.is_edit_mode}
                    onCheckedChange={handleToggleEditMode}
                    data-testid="edit-mode-toggle"
                  />
                </div>
              </div>

              <DropdownMenuSeparator className="bg-white/10" />

              {/* Admin Section */}
              <div className="px-2 py-2">
                <Label className="text-xs uppercase tracking-wider text-[#86868B] mb-2 block">
                  Admin
                </Label>
                {!isAdmin ? (
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Admin code..."
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                      className="h-9 bg-[#2C2C2E] border-transparent text-white placeholder:text-[#6E6E73]"
                      data-testid="admin-code-input"
                    />
                    <Button
                      onClick={handleAdminLogin}
                      size="sm"
                      className="bg-[#0A84FF] hover:bg-[#0077ED] text-white"
                      data-testid="admin-login-button"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      onClick={() => setIsLogVisible(true)}
                      variant="secondary"
                      size="sm"
                      className="w-full justify-start bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white"
                      data-testid="view-log-button"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Bekijk Logboek
                    </Button>
                    <Button
                      onClick={handleAdminLogout}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-[#86868B] hover:text-white hover:bg-white/10"
                      data-testid="admin-logout-button"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Uitloggen
                    </Button>
                  </div>
                )}
              </div>

              <DropdownMenuSeparator className="bg-white/10" />

              {/* Payment Link */}
              <div className="px-2 py-2">
                <Label className="text-xs uppercase tracking-wider text-[#86868B] mb-2 block">
                  Betaalverzoek Link
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="Plak hier de link..."
                    value={tempPaymentLink}
                    onChange={(e) => setTempPaymentLink(e.target.value)}
                    className="h-9 bg-[#2C2C2E] border-transparent text-white placeholder:text-[#6E6E73]"
                    data-testid="payment-link-input"
                  />
                  <Button
                    onClick={handleSavePaymentLink}
                    size="sm"
                    className="bg-[#0A84FF] hover:bg-[#0077ED] text-white"
                    data-testid="save-payment-link-button"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <DropdownMenuSeparator className="bg-white/10" />

              {/* Reset Button */}
              <DropdownMenuItem
                onClick={() => setIsResetConfirmVisible(true)}
                className="text-[#FF453A] hover:text-[#FF453A] hover:bg-[#FF453A]/10 cursor-pointer"
                data-testid="reset-app-button"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                App Resetten
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Order Form */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="bg-[#151516] border-white/10 sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl text-white">
                  <ShoppingBag className="h-5 w-5 text-[#0A84FF]" />
                  Nieuwe Bestelling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Name */}
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#86868B] mb-2 block">
                    Naam
                  </Label>
                  <Input
                    placeholder="Naam van collega"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-11 bg-[#1C1C1E] border-transparent focus:border-[#0A84FF]/50 focus:ring-1 focus:ring-[#0A84FF] text-white placeholder:text-[#6E6E73]"
                    data-testid="customer-name-input"
                  />
                </div>

                {/* Snacks */}
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#86868B] mb-2 block">
                    Snacks
                  </Label>
                  <div className="space-y-2">
                    {currentOrderItems.map((item, index) => (
                      <div key={index} className="flex gap-2 animate-fade-in">
                        <Select
                          value={item.menu_item_id}
                          onValueChange={(value) => handleItemChange(index, value)}
                        >
                          <SelectTrigger
                            className="flex-1 h-11 bg-[#1C1C1E] border-transparent text-white"
                            data-testid={`snack-select-${index}`}
                          >
                            <SelectValue placeholder="-- Selecteer Snack --" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1C1C1E] border-white/10 text-white max-h-[300px]">
                            {Object.entries(menuByCategory).map(([category, items]) => (
                              <SelectGroup key={category}>
                                <SelectLabel className="text-[#0A84FF] font-semibold">
                                  {category}
                                </SelectLabel>
                                {items.map((menuItem) => (
                                  <SelectItem
                                    key={menuItem.id}
                                    value={menuItem.id}
                                    className="hover:bg-white/10"
                                  >
                                    {menuItem.name} - {formatPrice(menuItem.price)}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
                          className="w-16 h-11 bg-[#1C1C1E] border-transparent text-white text-center"
                          data-testid={`quantity-input-${index}`}
                        />
                        {currentOrderItems.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            className="h-11 w-11 text-[#FF453A] hover:bg-[#FF453A]/10"
                            data-testid={`remove-item-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleAddItem}
                    className="w-full mt-2 text-[#0A84FF] hover:bg-[#0A84FF]/10"
                    data-testid="add-snack-button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Snack Toevoegen
                  </Button>
                </div>

                {/* Place Order Button */}
                <Button
                  onClick={handlePlaceOrder}
                  className="w-full h-12 bg-[#0A84FF] hover:bg-[#0077ED] text-white font-medium btn-glow"
                  data-testid="place-order-button"
                >
                  Bestelling Plaatsen
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Orders, Overview, Payment Status */}
          <div className="lg:col-span-8 space-y-6">
            {/* Orders List */}
            <Card className="bg-[#151516] border-white/10">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl text-white">
                  <Users className="h-5 w-5 text-[#0A84FF]" />
                  Wie-heeft-wat-besteld
                  {settings.is_edit_mode && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-[#FF9F0A]/20 text-[#FF9F0A] rounded">
                      <Edit3 className="h-3 w-3 inline mr-1" />
                      Bewerkmodus
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-[#6E6E73] text-center py-8">Nog geen bestellingen...</p>
                ) : (
                  <ScrollArea className="max-h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                          <TableHead className="text-[#86868B]">Naam</TableHead>
                          <TableHead className="text-[#86868B]">Bestelling</TableHead>
                          <TableHead className="text-[#86868B] text-right">Totaalprijs</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow
                            key={order.id}
                            className="border-white/10 hover:bg-white/5"
                            data-testid={`order-row-${order.id}`}
                          >
                            <TableCell className="font-medium text-white">
                              {order.customer_name}
                            </TableCell>
                            <TableCell className="text-[#BFBFBF]">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  {settings.is_edit_mode ? (
                                    <>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={item.quantity}
                                        onChange={(e) =>
                                          handleUpdateOrderItemQuantity(
                                            order.id,
                                            idx,
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        className="w-14 h-7 bg-[#2C2C2E] border-transparent text-white text-center text-sm"
                                        data-testid={`edit-quantity-${order.id}-${idx}`}
                                      />
                                      <span className="text-sm">x {item.name}</span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          setItemToDelete({
                                            orderId: order.id,
                                            itemIndex: idx,
                                            itemName: item.name,
                                            customerName: order.customer_name,
                                          })
                                        }
                                        className="h-6 w-6 text-[#FF453A] hover:bg-[#FF453A]/10"
                                        data-testid={`delete-item-${order.id}-${idx}`}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </>
                                  ) : (
                                    <span className="text-sm">
                                      {item.quantity}x {item.name}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </TableCell>
                            <TableCell className="text-right text-white font-medium">
                              {formatPrice(order.total_price)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Total Overview */}
            <Card className="bg-[#151516] border-white/10">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl text-white">
                  <Receipt className="h-5 w-5 text-[#0A84FF]" />
                  Totaaloverzicht
                </CardTitle>
                {totalOverview.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExportEmail}
                    className="bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white"
                    data-testid="export-email-button"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Exporteer naar e-mail
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {totalOverview.length === 0 ? (
                  <p className="text-[#6E6E73] text-center py-4">Geen items besteld</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                          <TableHead className="text-[#86868B]">Snack</TableHead>
                          <TableHead className="text-[#86868B] text-center">Aantal</TableHead>
                          <TableHead className="text-[#86868B] text-right">Subtotaal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {totalOverview.map((item, idx) => (
                          <TableRow key={idx} className="border-white/10 hover:bg-white/5">
                            <TableCell className="text-white">{item.name}</TableCell>
                            <TableCell className="text-center text-[#BFBFBF]">
                              {item.quantity}x
                            </TableCell>
                            <TableCell className="text-right text-white">
                              {formatPrice(item.subtotal)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                      <span className="text-lg font-semibold text-white">Eindtotaal</span>
                      <span
                        className="text-2xl font-bold text-[#30D158]"
                        data-testid="grand-total"
                      >
                        {formatPrice(grandTotal)}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment Status */}
            <Card className="bg-[#151516] border-white/10">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl text-white">
                  <CreditCard className="h-5 w-5 text-[#0A84FF]" />
                  Betalingsstatus
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Link - Above Checklist */}
                {settings.payment_link && (
                  <div className="p-4 rounded-lg bg-[#30D158]/10 border border-[#30D158]/20">
                    <p className="text-sm text-[#BFBFBF] mb-3">
                      Graag je deel overmaken via de onderstaande link:
                    </p>
                    <Button
                      asChild
                      className="w-full bg-[#30D158] hover:bg-[#28B84C] text-white font-medium"
                      data-testid="payment-link-button"
                    >
                      <a href={settings.payment_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Betaalverzoek openen
                      </a>
                    </Button>
                  </div>
                )}

                {/* Payment Checklist */}
                {orders.length === 0 ? (
                  <p className="text-[#6E6E73] text-center py-4">Geen bestellingen om te betalen</p>
                ) : (
                  <div className="space-y-2">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-[#1C1C1E] hover:bg-[#2C2C2E] transition-colors"
                        data-testid={`payment-row-${order.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`paid-${order.id}`}
                            checked={order.is_paid}
                            onCheckedChange={(checked) =>
                              handlePaymentStatusChange(order.id, checked)
                            }
                            className="border-white/20 data-[state=checked]:bg-[#30D158] data-[state=checked]:border-[#30D158]"
                            data-testid={`payment-checkbox-${order.id}`}
                          />
                          <Label
                            htmlFor={`paid-${order.id}`}
                            className={`cursor-pointer ${
                              order.is_paid ? "text-[#30D158]" : "text-white"
                            }`}
                          >
                            {order.customer_name}
                          </Label>
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            order.is_paid ? "text-[#30D158]" : "text-[#FF9F0A]"
                          }`}
                        >
                          {order.is_paid ? "Betaald" : "Nog te betalen"} -{" "}
                          {formatPrice(order.total_price)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Activity Log Dialog */}
      <Dialog open={isLogVisible} onOpenChange={setIsLogVisible}>
        <DialogContent className="bg-[#1C1C1E] border-white/10 text-white max-w-5xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">Activiteitenlogboek</DialogTitle>
            <DialogDescription className="text-[#86868B]">
              Overzicht van alle activiteiten in de app
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-[#86868B]">Tijdstip</TableHead>
                  <TableHead className="text-[#86868B]">Actie</TableHead>
                  <TableHead className="text-[#86868B]">Details</TableHead>
                  <TableHead className="text-[#86868B]">Apparaat</TableHead>
                  <TableHead className="text-[#86868B]">IP-adres</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLog.map((log) => {
                  const deviceInfo = parseDeviceInfo(log.device_info);
                  return (
                    <TableRow key={log.id} className="border-white/10">
                      <TableCell className="text-[#BFBFBF] text-xs whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("nl-NL")}
                      </TableCell>
                      <TableCell className="text-white">{log.action}</TableCell>
                      <TableCell className="text-[#BFBFBF]">{log.details}</TableCell>
                      <TableCell className="text-[#86868B] text-xs">
                        <div className="flex flex-col">
                          <span className="text-[#BFBFBF]">{deviceInfo.device}</span>
                          <span className="text-[#6E6E73]">{deviceInfo.browser}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#0A84FF] text-xs font-mono">
                        {log.client_ip || "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
          <DialogFooter>
            <Button
              onClick={handleExportLog}
              className="bg-[#0A84FF] hover:bg-[#0077ED] text-white"
              data-testid="export-log-button"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporteer naar CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={isResetConfirmVisible} onOpenChange={setIsResetConfirmVisible}>
        <AlertDialogContent className="bg-[#1C1C1E] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#86868B]">
              Alle bestellingen worden permanent verwijderd. Deze actie kan niet ongedaan worden
              gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white border-white/10">
              Annuleren
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetApp}
              className="bg-[#FF453A] hover:bg-[#FF3B30] text-white"
              data-testid="confirm-reset-button"
            >
              Ja, reset de app
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent className="bg-[#1C1C1E] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Verwijderen</AlertDialogTitle>
            <AlertDialogDescription className="text-[#86868B]">
              Weet je zeker dat je {itemToDelete?.itemName} van de bestelling van{" "}
              {itemToDelete?.customerName} wilt verwijderen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white border-white/10">
              Annuleren
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteItem}
              className="bg-[#FF453A] hover:bg-[#FF3B30] text-white"
              data-testid="confirm-delete-item-button"
            >
              Ja, verwijder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;
