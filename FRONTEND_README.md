# NetGuardian Frontend

A React TypeScript frontend for the NetGuardian network monitoring and throttling system. This frontend connects to the Django backend to provide real-time network monitoring, device management, and intelligent throttling controls.

## 🎯 Features

- **Real-time Dashboard** - Live network statistics and device monitoring
- **WebSocket Integration** - Real-time updates via WebSocket connection
- **Device Control** - Throttle/unthrottle network devices with one click
- **Interactive Charts** - Bandwidth usage visualization with Recharts
- **Responsive Design** - Tailwind CSS with smooth animations
- **Connection Status** - Visual indicators for backend connectivity
- **Event Logging** - Real-time activity feed

## 🏗️ Architecture

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS 4** for styling
- **Framer Motion** for smooth animations
- **Recharts** for data visualization
- **React Router** for navigation
- **WebSockets** for real-time communication

## 📋 Prerequisites

- Node.js 20.12.2+ (for compatibility with current Vite version)
- NetGuardian Django Backend running on `localhost:8002`
- Modern web browser with WebSocket support

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd throtl
npm install
```

### 2. Environment Configuration

Create a `.env` file (or copy from `.env.example`):

```env
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:8002
VITE_WS_BASE_URL=ws://localhost:8002

# Development settings
VITE_DEV_MODE=true
VITE_LOG_LEVEL=info
```

### 3. Start Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

## 🔌 Backend Integration

### API Endpoints Used

The frontend connects to these NetGuardian backend endpoints:

- `GET /api/health/` - System health check
- `GET /api/devices/` - Current network devices
- `POST /api/throttle/` - Throttle/unthrottle devices
- `WebSocket /ws/stats/` - Real-time network statistics

### WebSocket Data Format

The frontend expects network statistics in this format:

```json
{
  "timestamp": 1234567890.123,
  "global": {
    "total_down_mbps": 25.5,
    "total_up_mbps": 5.2
  },
  "devices": [
    {
      "ip": "10.42.0.140",
      "mac": "aa:bb:cc:dd:ee:ff",
      "hostname": "device-name",
      "down_mbps": 15.3,
      "up_mbps": 2.1,
      "status": "normal"
    }
  ],
  "events": ["[10:42:15] Throttled 10.42.0.140"]
}
```

### Throttle API Format

When throttling devices, the frontend sends:

```json
{
  "ip": "10.42.0.140",
  "action": "throttle",
  "limit_mbps": 2.0,
  "reason": "Manual throttle from dashboard"
}
```

## 🖥️ Components

### Dashboard Components

- **Header** - Title, connection status, and controls
- **StatCard** - Bandwidth and device statistics
- **NetworkHealthChart** - Real-time bandwidth visualization
- **ConnectedClientsList** - Device list with throttle controls
- **BandwidthDonutChart** - Bandwidth distribution chart
- **EventsLog** - Real-time activity feed
- **ConnectionStatus** - Backend connection indicator

### Core Hooks

- **useNetworkData** - Main hook for network data and device control
  - WebSocket connection management
  - Real-time data processing
  - Throttle/unthrottle functions
  - Error handling

### Services

- **API Service** - Backend communication utilities
  - REST API calls
  - WebSocket URL management
  - Data transformation utilities
  - Error handling

## 🎨 UI Features

### Real-time Indicators

- **Green dot** - Normal device status
- **Red pulsing dot** - Throttled device
- **Connection status** - Backend connectivity indicator
- **Loading states** - Smooth loading animations

### Interactive Elements

- **Click to select** - Select devices for detailed view
- **Throttle buttons** - One-click throttle/unthrottle
- **Bandwidth bars** - Visual bandwidth usage indicators
- **Hover effects** - Smooth transitions and feedback

### Responsive Design

- **Mobile-first** - Optimized for all screen sizes
- **Grid layouts** - Responsive dashboard layout
- **Adaptive charts** - Charts scale with screen size

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8002` | Backend API URL |
| `VITE_WS_BASE_URL` | `ws://localhost:8002` | WebSocket URL |
| `VITE_DEV_MODE` | `true` | Development mode flag |
| `VITE_LOG_LEVEL` | `info` | Console logging level |

### Customization

**Bandwidth Threshold**: Modify `THRESHOLD_MBPS` in `useNetworkData.ts`

```typescript
export const THRESHOLD_MBPS = 10; // 10 Mbps threshold
```

**Chart Colors**: Update theme colors in Tailwind config or component styles

**Polling Intervals**: WebSocket handles real-time updates automatically

## 🧪 Testing

### Manual Testing

1. **Start Backend**: Ensure Django backend is running on port 8002
2. **Start Frontend**: Run `npm run dev`
3. **Check Connection**: Connection status should show "Connected"
4. **Test Throttling**: Click throttle buttons on devices
5. **Verify Updates**: Watch real-time updates in dashboard

### API Testing

```bash
# Test backend connectivity
curl -s http://localhost:8002/api/health/ | python3 -m json.tool

# Test device listing
curl -s http://localhost:8002/api/devices/ | python3 -m json.tool
```

### WebSocket Testing

Open browser developer tools and check:
- WebSocket connection in Network tab
- Console logs for connection status
- Real-time data updates

## 🐛 Troubleshooting

### Connection Issues

**Frontend can't connect to backend**:
- Check if backend is running on port 8002
- Verify CORS settings in Django backend
- Check firewall/antivirus blocking connections

**WebSocket fails to connect**:
- Ensure backend is using ASGI server (daphne)
- Check Redis is running for WebSocket support
- Verify WebSocket URL format

### No Data Appearing

**No devices shown**:
- Check if network engine is sending data to backend
- Verify Redis connection between engine and backend
- Monitor backend logs for data processing

**Throttle buttons not working**:
- Check API endpoints are accessible
- Verify authentication if implemented
- Check browser console for errors

### Performance Issues

**Slow chart updates**:
- Check WebSocket connection stability
- Monitor browser memory usage
- Reduce chart history length if needed

## 📝 Development

### Adding New Features

1. **Create components** in `src/components/`
2. **Add API calls** in `src/services/api.ts`
3. **Update types** in `src/types.tsx`
4. **Add to dashboard** in `src/pages/Dashboard.tsx`

### Code Structure

```
src/
├── components/           # Reusable UI components
│   ├── dashboard/       # Dashboard-specific components
│   └── ConnectionStatus.tsx
├── hooks/               # Custom React hooks
│   └── useNetworkData.ts
├── pages/               # Page components
│   └── Dashboard.tsx
├── services/            # API and external services
│   └── api.ts
└── types.tsx           # TypeScript type definitions
```

### TypeScript Types

Key types for backend integration:

- `NetworkDevice` - Device information from backend
- `NetworkStats` - WebSocket message format
- `ThrottleRequest` - API request format
- `Client` - Frontend device representation

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Environment Setup

For production, update environment variables:

```env
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_WS_BASE_URL=wss://your-backend-domain.com
VITE_DEV_MODE=false
```

### Serve Static Files

The built files in `dist/` can be served by:
- Nginx
- Apache
- Vercel
- Netlify
- Any static file server

## 🤝 Integration Checklist

### Backend Requirements

- ✅ Django backend running on port 8002
- ✅ WebSocket endpoint at `/ws/stats/`
- ✅ REST API endpoints for device control
- ✅ CORS configured for frontend domain
- ✅ Redis running for WebSocket support

### Frontend Setup

- ✅ Environment variables configured
- ✅ Dependencies installed
- ✅ Development server running
- ✅ Backend connectivity verified

### Network Engine Integration

- ✅ Network engine publishing to Redis
- ✅ Backend processing and forwarding data
- ✅ Frontend receiving real-time updates
- ✅ Throttle commands reaching network engine

## 📊 Monitoring

### Browser Console

Monitor these logs for health:
- WebSocket connection events
- API request/response logs
- Real-time data processing
- Error messages

### Network Tab

Check for:
- Successful API calls to backend
- Active WebSocket connection
- No 404 or 500 errors
- Reasonable response times

## 🆘 Support

For issues:

1. Check browser console for errors
2. Verify backend connectivity
3. Test API endpoints manually
4. Check WebSocket connection status
5. Monitor network engine data flow

## 📄 License

Same as NetGuardian backend project.