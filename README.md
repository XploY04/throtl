# Complete Beginner's Guide: Create a Wi-Fi Hotspot with Speed Limits

This guide will help you turn your Linux laptop into a Wi-Fi hotspot where you can control how fast each device can download and upload. Perfect for sharing your phone's internet with speed limits.

**No prior experience needed** - follow every step exactly as written.

---

## What You Need

- A Linux laptop (Ubuntu 20.04 or newer)
- Internet connection (USB cable connected to your phone for tethering, OR ethernet cable)
- Another device to test (laptop, phone, or tablet)

---

## Part 1: Install Required Software

Open **Terminal** on your Linux laptop:
- Press `Ctrl + Alt + T` on your keyboard
- A black window will appear - this is the terminal

Copy and paste these commands one by one (press `Enter` after each):

```bash
sudo apt update
```
*(It will ask for your password - type it and press Enter. You won't see the password as you type, this is normal)*

```bash
sudo apt install -y iproute2 iptables network-manager
```
*(This installs the tools we need. Wait for it to finish)*

---

## Part 2: Find Your Network Interface Names

In the terminal, type:

```bash
ip link
```

You'll see output like this:
```
1: lo: <LOOPBACK...>
2: wlo1: <BROADCAST,MULTICAST...>
17: enxfeb6d549694a: <BROADCAST,MULTICAST...>
```

**Write down these two names:**

1. **Wi-Fi interface** - usually starts with `wl` like `wlo1` or `wlan0`
   - This is your laptop's Wi-Fi adapter
   - Write it here: `_________________`

2. **Internet interface** - could be:
   - `enx...` if using USB phone tether
   - `eth0` or `enp...` if using ethernet cable
   - Write it here: `_________________`

---

## Part 3: Create Your Wi-Fi Hotspot

Copy this command, but **replace the parts in CAPS**:

```bash
nmcli device wifi hotspot ifname YOUR_WIFI_INTERFACE ssid "YOUR_NETWORK_NAME" password "YOUR_PASSWORD"
```

**Example** (if your Wi-Fi interface is `wlo1`):
```bash
nmcli device wifi hotspot ifname wlo1 ssid "MyHotspot" password "12345678"
```

**Important:**
- Replace `YOUR_WIFI_INTERFACE` with the Wi-Fi name you wrote down (like `wlo1`)
- Replace `YOUR_NETWORK_NAME` with any name you want (like "MyHotspot")
- Replace `YOUR_PASSWORD` with a password (must be at least 8 characters)

Press Enter. You should see:
```
Device 'wlo1' successfully activated
```

**Your hotspot is now broadcasting!** But devices can't access internet yet.

---

## Part 4: Enable Internet Sharing

Run this command (no changes needed):

```bash
sudo sysctl -w net.ipv4.ip_forward=1
```

Now run this command, but **replace YOUR_INTERNET_INTERFACE**:

```bash
sudo iptables -t nat -A POSTROUTING -o YOUR_INTERNET_INTERFACE -j MASQUERADE
```

**Example** (if your internet interface is `enxfeb6d549694a`):
```bash
sudo iptables -t nat -A POSTROUTING -o enxfeb6d549694a -j MASQUERADE
```

**Now your hotspot shares internet!**

---

## Part 5: Connect a Test Device

### Option A: Using Another Laptop

1. On your **second laptop**, open Wi-Fi settings
2. Find your hotspot name (the name you chose, like "MyHotspot")
3. Connect using the password you set
4. Once connected, open terminal or command prompt:
   - **Windows:** Press `Win + R`, type `cmd`, press Enter
   - **Mac/Linux:** Open Terminal

5. Find your IP address:
   - **Windows:** Type `ipconfig` and press Enter
   - **Mac/Linux:** Type `ifconfig` or `ip addr` and press Enter

6. Look for an IP address like `10.42.0.XX` (example: `10.42.0.18`)
7. **Write down this IP:** `_________________`

### Option B: Using a Phone

1. On your phone, open Wi-Fi settings
2. Connect to your hotspot (the name you chose)
3. Enter the password
4. Once connected:
   - **iPhone:** Settings → Wi-Fi → tap the (i) icon next to your network → note the IP Address
   - **Android:** Settings → Wi-Fi → tap your connected network → note the IP address

5. **Write down this IP:** `_________________` (example: `10.42.0.25`)

---

## Part 6: Set Speed Limits

Now we'll limit how fast this device can download and upload.

On your **Linux laptop** (the hotspot), create a file with these settings:

```bash
nano speed_limit.sh
```

Copy and paste this entire script into the editor:

```bash
#!/bin/bash

# EDIT THESE VALUES ONLY
WIFI_IF="wlo1"                    # Your Wi-Fi interface from Part 2
UP_IF="enxfeb6d549694a"          # Your internet interface from Part 2
CLIENT_IP="10.42.0.18"           # The device IP from Part 5
RATE="1mbit"                      # Speed limit (try: 1mbit, 5mbit, 10mbit)

echo "Setting up bandwidth limits..."
echo "Wi-Fi Interface: $WIFI_IF"
echo "Internet Interface: $UP_IF"
echo "Client IP: $CLIENT_IP"
echo "Speed Limit: $RATE"
echo ""

# Limit DOWNLOAD speed (hotspot sends to client)
echo "Setting download limit..."
sudo tc qdisc del dev $WIFI_IF root 2>/dev/null || true
sudo tc qdisc add dev $WIFI_IF root handle 1: htb default 100
sudo tc class add dev $WIFI_IF parent 1: classid 1:1 htb rate 1000mbit
sudo tc class add dev $WIFI_IF parent 1:1 classid 1:10 htb rate $RATE ceil $RATE
sudo tc filter add dev $WIFI_IF protocol ip parent 1: prio 1 u32 match ip dst $CLIENT_IP/32 flowid 1:10

# Limit UPLOAD speed (client sends to hotspot)
echo "Setting upload limit..."
sudo iptables -t mangle -A PREROUTING -s $CLIENT_IP -j MARK --set-mark 10

sudo tc qdisc del dev $UP_IF root 2>/dev/null || true
sudo tc qdisc add dev $UP_IF root handle 1: htb default 100
sudo tc class add dev $UP_IF parent 1: classid 1:1 htb rate 1000mbit
sudo tc class add dev $UP_IF parent 1:1 classid 1:10 htb rate $RATE ceil $RATE
sudo tc filter add dev $UP_IF protocol ip parent 1: prio 1 handle 10 fw flowid 1:10

echo ""
echo "✅ Speed limits applied!"
echo "Download limit: $RATE"
echo "Upload limit: $RATE"
echo ""
echo "Test using fast.com or speedtest.net on your device"
```

**Now edit the top 4 lines:**
1. Press `Ctrl + 6` to start selecting
2. Use arrow keys to highlight the values you need to change
3. Replace with your values from Part 2 and Part 5:
   - `WIFI_IF` - your Wi-Fi interface name
   - `UP_IF` - your internet interface name
   - `CLIENT_IP` - the device IP you want to limit
   - `RATE` - speed limit (1mbit = 1 Mbps, 5mbit = 5 Mbps, etc.)

4. Press `Ctrl + O` to save (press Enter to confirm)
5. Press `Ctrl + X` to exit

**Run the script:**

```bash
chmod +x speed_limit.sh
sudo ./speed_limit.sh
```

You should see:
```
✅ Speed limits applied!
```

---

## Part 7: Test the Speed Limits

### Option A: Test with a Laptop

On the **connected laptop**, open a web browser and go to:
- https://fast.com (simple, shows download speed)
- https://speedtest.net (shows both download and upload)

**You should see speeds limited to what you set** (example: ~1 Mbps if you set `RATE="1mbit"`)

### Option B: Test with a Phone

1. Open browser on your phone
2. Go to https://fast.com
3. Wait for the speed test to complete
4. Speed should be limited to your set value

---

## Part 8: Managing Speed Limits

### Change the Speed Limit

1. Edit the script again:
   ```bash
   nano speed_limit.sh
   ```

2. Change the `RATE` value (example: change `"1mbit"` to `"5mbit"`)

3. Save (`Ctrl + O`, Enter) and exit (`Ctrl + X`)

4. Run the script again:
   ```bash
   sudo ./speed_limit.sh
   ```

### Remove All Speed Limits

```bash
sudo tc qdisc del dev wlo1 root
sudo tc qdisc del dev enxfeb6d549694a root
sudo iptables -t mangle -F
```
*(Replace `wlo1` and `enxfeb6d549694a` with your interface names)*

### Stop the Hotspot Completely

```bash
nmcli connection down Hotspot
sudo iptables -t nat -F
```

---

## Part 9: Limit Multiple Devices

To limit a second device with a different speed:

1. Connect the second device to your hotspot
2. Find its IP address (same as Part 5)
3. Create a new script file:
   ```bash
   nano speed_limit_device2.sh
   ```

4. Copy the same script from Part 6, but change:
   - `CLIENT_IP` to the new device's IP
   - `RATE` to a different speed if you want
   - Change the mark number from `10` to `11`:
     - Line with `--set-mark 10` → change to `--set-mark 11`
     - Line with `handle 10 fw` → change to `handle 11 fw`
   - Change class IDs from `1:10` to `1:11` (4 places)

5. Save and run:
   ```bash
   chmod +x speed_limit_device2.sh
   sudo ./speed_limit_device2.sh
   ```

---

## Troubleshooting

### "Device 'wlo1' not found"
- You used the wrong interface name
- Run `ip link` again and use the exact name shown

### "Cannot connect to hotspot"
- Check if Wi-Fi is enabled: `rfkill list`
- If blocked, unblock: `sudo rfkill unblock wifi`
- Restart: `sudo systemctl restart NetworkManager`

### "Connected but no internet"
- Check IP forwarding: `sysctl net.ipv4.ip_forward` (should show `= 1`)
- Check NAT rule: `sudo iptables -t nat -L -v -n` (should show MASQUERADE)

### "Speed not limited"
- Verify your CLIENT_IP is correct
- Check if rules are active:
  ```bash
  sudo tc -s class show dev wlo1
  sudo tc -s class show dev enxfeb6d549694a
  ```
- Look for class `1:10` with packet counts increasing

### "Password: command not found"
- You have quotes issue. Use straight quotes `"` not curly quotes `""`
- Retype the command manually instead of copying

---

## Quick Reference Card

**Start hotspot:**
```bash
nmcli device wifi hotspot ifname wlo1 ssid "YourName" password "YourPass123"
sudo sysctl -w net.ipv4.ip_forward=1
sudo iptables -t nat -A POSTROUTING -o enxfeb6d549694a -j MASQUERADE
```

**Apply speed limits:**
```bash
sudo ./speed_limit.sh
```

**Check limits working:**
```bash
sudo tc -s class show dev wlo1
```

**Remove limits:**
```bash
sudo tc qdisc del dev wlo1 root
sudo tc qdisc del dev enxfeb6d549694a root
sudo iptables -t mangle -F
```

**Stop hotspot:**
```bash
nmcli connection down Hotspot
```

---

## Next Steps

Once comfortable, you can:
- Set different speeds for different devices
- Create a startup script to auto-enable on boot
- Monitor bandwidth usage per device
- Implement time-based limits

**Congratulations!** You now have a fully functional Wi-Fi hotspot with speed control.