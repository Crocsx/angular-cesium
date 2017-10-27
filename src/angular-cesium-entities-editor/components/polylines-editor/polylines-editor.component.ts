import { Component, OnDestroy, ViewChild } from '@angular/core';
import { EditModes } from '../../models/edit-mode.enum';
import { PolygonEditUpdate } from '../../models/polygon-edit-update';
import { AcNotification } from '../../../angular-cesium/models/ac-notification';
import { EditActions } from '../../models/edit-actions.enum';
import { AcLayerComponent } from '../../../angular-cesium/components/ac-layer/ac-layer.component';
import { CoordinateConverter } from '../../../angular-cesium/services/coordinate-converter/coordinate-converter.service';
import { MapEventsManagerService } from '../../../angular-cesium/services/map-events-mananger/map-events-manager';
import { Subject } from 'rxjs/Subject';
import { CameraService } from '../../../angular-cesium/services/camera/camera.service';
import { EditPoint } from '../../models/edit-point';
import { PolylinesEditorService } from '../../services/entity-editors/polyline-editor/polylines-editor.service';
import { PolylinesManagerService } from '../../services/entity-editors/polyline-editor/polylines-manager.service';

@Component({
	selector : 'polylines-editor',
	templateUrl : './polylines-editor.component.html',
	providers : [CoordinateConverter, PolylinesManagerService]
})
export class PolylinesEditorComponent implements OnDestroy {
	
	public Cesium = Cesium;
	public editPoints$ = new Subject<AcNotification>();
	public editPolylines$ = new Subject<AcNotification>();
	
	@ViewChild('editPointsLayer') private editPointsLayer: AcLayerComponent;
	@ViewChild('editPolylinesLayer') private editPolylinesLayer: AcLayerComponent;
	
	constructor(private polylinesEditor: PolylinesEditorService,
							private coordinateConverter: CoordinateConverter,
							private mapEventsManager: MapEventsManagerService,
							private cameraService: CameraService,
							private polylinesManager: PolylinesManagerService) {
		this.polylinesEditor.init(this.mapEventsManager, this.coordinateConverter, this.cameraService, polylinesManager);
		this.startListeningToEditorUpdates();
	}
	
	private startListeningToEditorUpdates() {
		this.polylinesEditor.onUpdate().subscribe((update: PolygonEditUpdate) => {
			if (update.editMode === EditModes.CREATE || update.editMode === EditModes.CREATE_OR_EDIT) {
				this.handleCreateUpdates(update);
			}
			else if (update.editMode === EditModes.EDIT) {
				this.handleEditUpdates(update);
			}
		});
	}
	
	handleCreateUpdates(update: PolygonEditUpdate) {
		switch (update.editAction) {
			case EditActions.INIT: {
				this.polylinesManager.createEditablePolyline(
					update.id,
					this.editPointsLayer,
					this.editPolylinesLayer,
					this.coordinateConverter,
					update.polygonOptions);
				break;
			}
			case EditActions.MOUSE_MOVE: {
				const polygon = this.polylinesManager.get(update.id);
				if (update.updatedPosition) {
					polygon.moveTempMovingPoint(update.updatedPosition);
				}
				break;
			}
			case EditActions.ADD_POINT: {
				const polygon = this.polylinesManager.get(update.id);
				if (update.updatedPosition) {
					polygon.addPoint(update.updatedPosition);
				}
				break;
			}
			case EditActions.ADD_LAST_POINT: {
				const polygon = this.polylinesManager.get(update.id);
				if (update.updatedPosition) {
					polygon.addLastPoint(update.updatedPosition);
				}
				break;
			}
			case EditActions.DISPOSE: {
				const polygon = this.polylinesManager.get(update.id);
				polygon.dispose();
				break;
			}
			default: {
				return;
			}
		}
	}
	
	handleEditUpdates(update: PolygonEditUpdate) {
		switch (update.editAction) {
			case EditActions.INIT: {
				this.polylinesManager.createEditablePolyline(
					update.id,
					this.editPointsLayer,
					this.editPolylinesLayer,
					this.coordinateConverter,
					update.polygonOptions,
					update.positions
				);
				break;
			}
			case EditActions.DRAG_POINT: {
				const polygon = this.polylinesManager.get(update.id);
				if (polygon && polygon.enableEdit) {
					polygon.movePoint(update.updatedPosition, update.updatedPoint);
				}
				break;
			}
			case EditActions.DRAG_POINT_FINISH: {
				const polygon = this.polylinesManager.get(update.id);
				if (polygon && polygon.enableEdit && update.updatedPoint.isVirtualEditPoint()) {
					polygon.addVirtualEditPoint(update.updatedPoint);
				}
				break;
			}
			case EditActions.REMOVE_POINT: {
				const polygon = this.polylinesManager.get(update.id);
				if (polygon && polygon.enableEdit) {
					polygon.removePoint(update.updatedPoint);
				}
				break;
			}
			case EditActions.DISABLE: {
				const polygon = this.polylinesManager.get(update.id);
				if (polygon) {
					polygon.enableEdit = false;
				}
				break;
			}
			case EditActions.ENABLE: {
				const polygon = this.polylinesManager.get(update.id);
				if (polygon) {
					polygon.enableEdit = true;
				}
				break;
			}
			case EditActions.SET_MANUALLY: {
				const polygon = this.polylinesManager.get(update.id);
				if (polygon) {
					polygon.setPointsManually(update.points);
				}
				break;
			}
			default: {
				return;
			}
		}
	}
	
	ngOnDestroy(): void {
		this.polylinesManager.clear();
	}
	
	getPointSize(point: EditPoint) {
		return point.isVirtualEditPoint() ? 8 : 15;
	}
}