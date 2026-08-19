import React, { useState, useEffect } from 'react';
import {
  ArrowDownToLine,
  Layers,
  MapPin,
  Barcode,
  Split,
  MoveRight,
  CheckCircle2,
  Boxes,
  Printer,
  Search,
  Plus,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useWarehouse } from '../services/warehouseStore';
import { BatchInventory, WarehouseLocation } from '../types';
import { printService } from '../services/printService';
import { cycleCountService, WarehouseLocationOption } from '../services/cycleCountService';
import { getSplittableBatches, splitBatchV2, SplittableBatchItem } from '../services/inventoryService';

export const PutawayModule: React.FC = () => {
  const {
    currentUser,
    receivingOrders,
    batches,
    locations,
    materials,
    putawayBatch,
    splitBatch,
    transferLocation,
    updateReceivingStatus,
    setActiveBarcodePrint
  } = useWarehouse();

  const [activeTab, setActiveTab] = useState<'putaway' | 'split' | 'transfer'>('putaway');

  // Real Database Locations from tbl_dm_location
  const [realLocations, setRealLocations] = useState<WarehouseLocationOption[]>([]);
  const [isLocationsLoading, setIsLocationsLoading] = useState<boolean>(false);

  // Real Database Splittable Batches from tbl_batch_inv
  const [realSplittableBatches, setRealSplittableBatches] = useState<SplittableBatchItem[]>([]);
  const [selectedRealBatchId, setSelectedRealBatchId] = useState<number>(0);
  const [isSplittableLoading, setIsSplittableLoading] = useState<boolean>(false);
  const [splitTargetLocation, setSplitTargetLocation] = useState<string>('');
  const [isSplitting, setIsSplitting] = useState<boolean>(false);
  const [lastSplitResult, setLastSplitResult] = useState<{
    parentBatchId: number;
    newBatchId: number;
    quantity: number;
    materialName: string;
    materialId: string;
    unit: string;
    locationCode: string;
    time: string;
  } | null>(null);

  const loadRealLocations = async () => {
    setIsLocationsLoading(true);
    try {
      const locs = await cycleCountService.getLocations();
      setRealLocations(locs || []);
      if (locs && locs.length > 0) {
        setNewLocationId(locs[0].locationCode);
        setSplitTargetLocation(locs[0].locationCode);
      }
    } catch (err) {
      console.warn('Lỗi tải danh mục vị trí ô kệ thực tế:', err);
    } finally {
      setIsLocationsLoading(false);
    }
  };

  const loadSplittableBatches = async () => {
    setIsSplittableLoading(true);
    try {
      const res = await getSplittableBatches('', undefined, 1, 100);
      setRealSplittableBatches(res.items || []);
      if (res.items && res.items.length > 0) {
        setSelectedRealBatchId(prev => (prev > 0 && res.items.some(i => i.batchId === prev) ? prev : res.items[0].batchId));
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách lô có thể tách:', err);
    } finally {
      setIsSplittableLoading(false);
    }
  };

  useEffect(() => {
    loadRealLocations();
    loadSplittableBatches();
  }, []);

  // Putaway state
  const [selectedReceivingOrder, setSelectedReceivingOrder] = useState<string>('');
  const [putawayItems, setPutawayItems] = useState<{
    materialId: string;
    quantity: number;
    locationId: string;
    batchNumber: string;
    manufactureDate: string;
    expiryDate: string;
  }[]>([]);

  // Split Batch state
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || '');
  const [splitCounts, setSplitCounts] = useState<number[]>([10, 10]);

  // Transfer state
  const [transferBatchId, setTransferBatchId] = useState<string>(batches[0]?.id || '');
  const [newLocationId, setNewLocationId] = useState<string>('01-01011');
  const [transferNote, setTransferNote] = useState<string>('');

  // Find receiving orders that are strictly QC_PASSED ready for putaway
  const ordersReadyForPutaway = receivingOrders.filter(
    r => r.status === 'QC_PASSED'
  );

  const handleSelectOrderForPutaway = (orderId: string) => {
    setSelectedReceivingOrder(orderId);
    const order = receivingOrders.find(r => r.id === orderId);
    if (!order) return;

    const defaultLoc = realLocations[0]?.locationCode || '01-01011';
    setPutawayItems(
      order.items.map(item => ({
        materialId: item.materialId,
        quantity: item.receivedQuantity,
        locationId: defaultLoc,
        batchNumber: item.batchNumber || `BAT-${Date.now()}`,
        manufactureDate: item.manufactureDate || new Date().toISOString().slice(0, 10),
        expiryDate: item.expiryDate || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10)
      }))
    );
  };

  const handleExecutePutaway = () => {
    if (!selectedReceivingOrder || putawayItems.length === 0) {
      alert('Vui lòng chọn phiếu nhận hàng và phân bổ vị trí kệ!');
      return;
    }

    const order = receivingOrders.find(r => r.id === selectedReceivingOrder);

    putawayItems.forEach(item => {
      putawayBatch({
        materialId: item.materialId,
        quantity: item.quantity,
        locationId: item.locationId,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        manufactureDate: item.manufactureDate,
        receivingOrderCode: order?.code
      });
    });

    updateReceivingStatus(selectedReceivingOrder, 'PUTAWAY_COMPLETED');
    alert('Đã hoàn tất lưu kho lên kệ và cập nhật số dư tồn kho!');
    setSelectedReceivingOrder('');
    setPutawayItems([]);
  };

  const handleExecuteSplit = async () => {
    const targetRealBatch = realSplittableBatches.find(b => b.batchId === selectedRealBatchId);
    if (!targetRealBatch) {
      alert('Vui lòng chọn một lô hàng thực tế hợp lệ!');
      return;
    }

    const totalSplitQty = splitCounts.reduce((a, b) => a + b, 0);
    if (totalSplitQty <= 0) {
      alert('Số lượng tách phải lớn hơn 0!');
      return;
    }
    if (totalSplitQty >= targetRealBatch.quantity) {
      alert(`Tổng số lượng tách (${totalSplitQty}) phải nhỏ hơn số lượng tồn của lô gốc (${targetRealBatch.quantity})!`);
      return;
    }

    setIsSplitting(true);
    try {
      for (const qty of splitCounts) {
        if (qty <= 0) continue;
        const res = await splitBatchV2(targetRealBatch.batchId, {
          splitQuantity: qty,
          targetLocation: splitTargetLocation || targetRealBatch.locationCode || undefined
        });

        if (res.isSuccess && res.newBatchId) {
          setLastSplitResult({
            parentBatchId: targetRealBatch.batchId,
            newBatchId: res.newBatchId,
            quantity: qty,
            materialName: targetRealBatch.materialName || '',
            materialId: targetRealBatch.materialId || '',
            unit: targetRealBatch.unit || 'Cái',
            locationCode: splitTargetLocation || targetRealBatch.locationCode || 'Chưa gán',
            time: new Date().toLocaleTimeString('vi-VN')
          });
        }
      }
      alert('Đã tách lô và sinh lô con mới thành công trong CSDL!');
      await loadSplittableBatches();
    } catch (err: any) {
      alert('Lỗi tách lô: ' + (err.message || err));
    } finally {
      setIsSplitting(false);
    }
  };

  const handleExecuteTransfer = () => {
    if (!transferBatchId || !newLocationId) return;
    transferLocation(transferBatchId, newLocationId, transferNote);
    alert('Đã điều chuyển vị trí kệ thành công!');
    setTransferNote('');
  };

  const selectedRealBatchObj = realSplittableBatches.find(b => b.batchId === selectedRealBatchId);

  const selectedBatchObj = batches.find(b => b.id === selectedBatchId);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
            <ArrowDownToLine className="w-4 h-4" /> Putaway & Racks Management
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Lưu Kho Lên Kệ, Tách Batch & Đổi Vị Trí (UC08 - UC11)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gán vị trí Kệ/Tầng theo sơ đồ kho, chia nhỏ lô hàng (batch splitting) và in tem barcode định vị.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('putaway')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'putaway' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Lưu Kho (Putaway)
          </button>
          <button
            onClick={() => setActiveTab('split')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'split' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tách Batch & In Tem
          </button>
          <button
            onClick={() => setActiveTab('transfer')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'transfer' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Đổi Vị Trí Kệ
          </button>
        </div>
      </div>

      {activeTab === 'putaway' && (
        <div className="space-y-6">
          {/* Order Selector */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              1. Chọn Phiếu Nhận Hàng Đã QC Pass Chờ Lưu Kho:
            </h3>

            {ordersReadyForPutaway.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                Không có phiếu nào đang chờ lưu kho. Hãy tạo phiếu nhận hàng mới hoặc đánh giá QC Pass.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ordersReadyForPutaway.map(order => {
                  const isSelected = selectedReceivingOrder === order.id;
                  return (
                    <div
                      key={order.id}
                      onClick={() => handleSelectOrderForPutaway(order.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-700 text-xs">{order.code}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {order.status}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-slate-800 mt-1 truncate">{order.supplier}</div>
                      <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                        <span>PO: {order.poNumber || 'N/A'}</span>
                        <span>{order.items.length} mặt hàng</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Allocation Table */}
          {selectedReceivingOrder && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    2. Phân Bổ Vị Trí Kệ - Tầng (Putaway Allocation):
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chọn chính xác Kệ (Rack) và Tầng (Tier) để hoàn tất quy trình nhập kho.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExecutePutaway}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm cursor-pointer"
                >
                  Xác Nhận Lưu Kho Lên Kệ
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Mã SKU</th>
                      <th className="p-3">Tên Vật Tư</th>
                      <th className="p-3">Số Lượng</th>
                      <th className="p-3">Mã Lô (Batch)</th>
                      <th className="p-3">Gán Vị Trí Kệ (Kho - Kệ - Tầng)</th>
                      <th className="p-3">HSD</th>
                      <th className="p-3 text-center">In Tem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {putawayItems.map((item, idx) => {
                      const mat = materials.find(m => m.id === item.materialId);
                      const selLoc = locations.find(l => l.id === item.locationId);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-blue-700">{mat?.code}</td>
                          <td className="p-3 font-medium text-slate-800">{mat?.name}</td>
                          <td className="p-3 font-mono font-bold text-emerald-700">
                            {item.quantity} {mat?.unit}
                          </td>
                          <td className="p-3 font-mono">{item.batchNumber}</td>
                          <td className="p-3 min-w-[240px]">
                            <select
                              value={item.locationId}
                              onChange={e => {
                                const updated = [...putawayItems];
                                updated[idx].locationId = e.target.value;
                                setPutawayItems(updated);
                              }}
                              className="w-full px-2.5 py-1.5 text-xs border border-blue-300 focus:border-blue-500 rounded-lg bg-blue-50/50 font-mono font-bold text-blue-900 shadow-2xs"
                            >
                              {realLocations.length > 0 ? (
                                realLocations.map(loc => (
                                  <option key={loc.locationCode} value={loc.locationCode}>
                                    📍 {loc.locationCode} ({loc.description || `Khu ${loc.areaCode} Kệ ${loc.shelfCode}`})
                                  </option>
                                ))
                              ) : (
                                locations.map(loc => (
                                  <option key={loc.id} value={loc.code}>
                                    📍 {loc.code} ({loc.warehouse})
                                  </option>
                                ))
                              )}
                            </select>
                          </td>
                          <td className="p-3 font-mono text-rose-600">{item.expiryDate}</td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={async () => {
                                setActiveBarcodePrint({
                                  title: 'Tem Lưu Kho (Putaway)',
                                  batchNumber: item.batchNumber,
                                  materialName: mat?.name || '',
                                  materialCode: mat?.code || '',
                                  locationCode: selLoc?.code || '',
                                  quantity: item.quantity,
                                  unit: mat?.unit || '',
                                  expiryDate: item.expiryDate
                                });
                                await printService.sendPrintLabel({
                                  batch: item.batchNumber,
                                  msnv: currentUser?.username || currentUser?.id || '00',
                                  kho: currentUser?.department || 'K01'
                                });
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 flex items-center gap-1 mx-auto cursor-pointer"
                            >
                              <Barcode className="w-3 h-3" /> In Tem
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'split' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Tách Batch Lớn Thành Các Gói / Cuộn Nhỏ (Batch Splitting - CSDL Thực Tế)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chia nhỏ lô hàng từ bảng tbl_batch_inv để cấp phát sản xuất, tự động sinh mã batch con mới và in tem định vị.
              </p>
            </div>
            <button
              type="button"
              onClick={loadSplittableBatches}
              disabled={isSplittableLoading}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSplittableLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>

          {/* Banner thông báo Lô Con Mới Sinh sau khi tách */}
          {lastSplitResult && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  <Barcode className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-emerald-900 font-mono">
                      🎉 ĐÃ TÁCH THÀNH CÔNG LÔ CON MỚI: LÔ #{lastSplitResult.newBatchId}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 font-bold text-[10px] rounded-md">
                      Lô Gốc: #{lastSplitResult.parentBatchId}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Vật tư: <strong>{lastSplitResult.materialId}</strong> — {lastSplitResult.materialName} • SL: <strong className="font-mono">{lastSplitResult.quantity} {lastSplitResult.unit}</strong> • Kệ: <strong className="font-mono">{lastSplitResult.locationCode}</strong> • Giờ: {lastSplitResult.time}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setActiveBarcodePrint({
                    title: 'TEM LÔ CON MỚI (SUB-BATCH)',
                    batchNumber: `BAT-${lastSplitResult.newBatchId}`,
                    materialName: lastSplitResult.materialName,
                    materialCode: lastSplitResult.materialId,
                    locationCode: lastSplitResult.locationCode,
                    quantity: lastSplitResult.quantity,
                    unit: lastSplitResult.unit,
                    expiryDate: 'CHUẨN_KHO'
                  });
                  await printService.sendPrintLabel({
                    batch: lastSplitResult.newBatchId,
                    msnv: currentUser?.username || currentUser?.id || '00',
                    kho: currentUser?.department || 'K01'
                  });
                }}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" />
                In Tem Lô Con Mới (10.17.16.102)
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Select Parent Batch from CSDL MMS1 */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn Lô Hàng Gốc Thực Tế Cần Tách (tbl_batch_inv):
                </label>
                {isSplittableLoading ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    Đang tải danh sách lô hàng thực tế...
                  </div>
                ) : (
                  <select
                    value={selectedRealBatchId}
                    onChange={e => setSelectedRealBatchId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-blue-300 focus:border-blue-500 rounded-xl bg-blue-50/40 font-mono font-bold text-blue-900"
                  >
                    {realSplittableBatches.length > 0 ? (
                      realSplittableBatches.map(b => (
                        <option key={b.batchId} value={b.batchId}>
                          Lô #{b.batchId} - {b.materialId} - {b.materialName} ({b.quantity} {b.unit}) [📍 {b.locationCode || 'Chưa gán'}]
                        </option>
                      ))
                    ) : (
                      <option value={0}>Không có lô hàng nào khả dụng</option>
                    )}
                  </select>
                )}
              </div>

              {selectedRealBatchObj && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã Lô Gốc (Batch ID):</span>
                    <span className="font-mono font-extrabold text-blue-700">#{selectedRealBatchObj.batchId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã SKU:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedRealBatchObj.materialId}</span>
                  </div>
                  {selectedRealBatchObj.bravoId && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mã Bravo:</span>
                      <span className="font-mono text-slate-600">{selectedRealBatchObj.bravoId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tên vật tư:</span>
                    <span className="font-semibold text-slate-800">{selectedRealBatchObj.materialName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số lượng tồn hiện có:</span>
                    <span className="font-mono font-extrabold text-emerald-700 text-sm">
                      {selectedRealBatchObj.quantity} {selectedRealBatchObj.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vị trí kệ hiện tại:</span>
                    <span className="font-mono font-bold text-slate-800">
                      📍 {selectedRealBatchObj.locationCode || 'Chưa vào kệ (Tồn tạm)'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Vị Trí Kệ Gán Cho Lô Con Mới (*):
                    </label>
                    <select
                      value={splitTargetLocation}
                      onChange={e => setSplitTargetLocation(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold text-blue-900"
                    >
                      {realLocations.map(loc => (
                        <option key={loc.locationCode} value={loc.locationCode}>
                          📍 {loc.locationCode} ({loc.description || `Khu ${loc.areaCode} Kệ ${loc.shelfCode}`})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Specify Split Quantities */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">Các Phần Tách Ra (Sub-Batches):</label>
                <button
                  type="button"
                  onClick={() => setSplitCounts([...splitCounts, 10])}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm Gói
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {splitCounts.map((qty, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400 w-8">#{idx + 1}</span>
                    <input
                      type="number"
                      min="1"
                      value={qty}
                      onChange={e => {
                        const updated = [...splitCounts];
                        updated[idx] = Math.max(1, Number(e.target.value));
                        setSplitCounts(updated);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono font-bold text-right"
                    />
                    <span className="text-xs text-slate-500 w-12">{selectedRealBatchObj?.unit || 'Cái'}</span>
                    <button
                      type="button"
                      onClick={() => setSplitCounts(splitCounts.filter((_, i) => i !== idx))}
                      disabled={splitCounts.length === 1}
                      className="text-slate-400 hover:text-rose-600 text-sm px-1 cursor-pointer disabled:opacity-20"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs flex justify-between">
                <span className="text-amber-900 font-medium">Tổng SL tách:</span>
                <span className="font-mono font-bold text-amber-900">
                  {splitCounts.reduce((a, b) => a + b, 0)} / {selectedRealBatchObj?.quantity || 0} {selectedRealBatchObj?.unit || ''}
                </span>
              </div>

              <button
                type="button"
                disabled={isSplitting}
                onClick={handleExecuteSplit}
                className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSplitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang Tách Batch Trong CSDL MMS1...</span>
                  </>
                ) : (
                  <>
                    <Split className="w-4 h-4" />
                    <span>Xác Nhận Tách Batch & Sinh Mã Con (INV-05)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transfer' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Điều Chuyển Vị Trí Kệ Kho (Rack-to-Rack Transfer)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Di chuyển toàn bộ lô hàng sang vị trí kệ mới và tự động cập nhật dung lượng sức chứa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lô Hàng Cần Chuyển:</label>
                <select
                  value={transferBatchId}
                  onChange={e => setTransferBatchId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-mono"
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.batchNumber} - {b.materialName} ({b.quantity} {b.unit}) [Hiện tại: {b.locationCode}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vị Trí Kệ Đích Mới:</label>
                <select
                  value={newLocationId}
                  onChange={e => setNewLocationId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-blue-300 rounded-xl bg-blue-50/50 font-mono font-bold text-blue-900 shadow-2xs"
                >
                  {realLocations.length > 0 ? (
                    realLocations.map(loc => (
                      <option key={loc.locationCode} value={loc.locationCode}>
                        📍 {loc.locationCode} ({loc.description || `Khu ${loc.areaCode} Kệ ${loc.shelfCode}`})
                      </option>
                    ))
                  ) : (
                    locations.map(loc => (
                      <option key={loc.id} value={loc.code}>
                        📍 {loc.code} ({loc.warehouse})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lý Do / Ghi Chú Điều Chuyển:</label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={e => setTransferNote(e.target.value)}
                  placeholder="e.g. Sắp xếp lại kho, nhường chỗ cho lô mới..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <button
                type="button"
                onClick={handleExecuteTransfer}
                className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm cursor-pointer"
              >
                Xác Nhận Chuyển Vị Trí Kệ
              </button>
            </div>

            {/* Visual Location Preview */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-center items-center text-center space-y-3">
              <MapPin className="w-8 h-8 text-blue-600" />
              <div className="text-xs font-bold text-slate-800">Cập Nhật Trực Quan Vị Trí Sơ Đồ</div>
              <div className="text-[11px] text-slate-500 max-w-xs">
                Sau khi điều chuyển, hệ thống sẽ ghi vết vào Sổ Giao Dịch Kho (Transaction Ledger) và cập nhật màu sắc sức chứa trên bản đồ kho.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
