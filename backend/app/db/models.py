from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, ForeignKey, JSON, String, Text
from sqlalchemy.orm import relationship
from app.db.base import Base


class IncidentModel(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(50), nullable=False, index=True)
    status = Column(String(50), nullable=False, index=True)
    affected_service = Column(String(100), nullable=False, index=True)
    detected_at = Column(DateTime(timezone=True), nullable=False, index=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)

    # Relationships
    telemetry_events = relationship(
        "TelemetryEventModel",
        back_populates="incident",
        cascade="all, delete-orphan",
        order_by="TelemetryEventModel.timestamp.asc()",
    )
    evidence = relationship(
        "EvidenceModel",
        back_populates="incident",
        cascade="all, delete-orphan",
    )
    investigations = relationship(
        "InvestigationModel",
        back_populates="incident",
        cascade="all, delete-orphan",
        order_by="InvestigationModel.started_at.desc()",
    )


class TelemetryEventModel(Base):
    __tablename__ = "telemetry_events"

    id = Column(String(36), primary_key=True)
    incident_id = Column(
        String(36),
        ForeignKey("incidents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    source = Column(String(50), nullable=False)
    event_type = Column(String(50), nullable=False)
    severity = Column(String(50), nullable=False, default="INFO")
    service = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    metadata_json = Column("metadata", JSON, nullable=False, default=dict)

    # Relationships
    incident = relationship("IncidentModel", back_populates="telemetry_events")
    evidence = relationship(
        "EvidenceModel",
        back_populates="telemetry_event",
        cascade="all, delete-orphan",
    )


class EvidenceModel(Base):
    __tablename__ = "evidence"

    id = Column(String(36), primary_key=True)
    incident_id = Column(
        String(36),
        ForeignKey("incidents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    telemetry_event_id = Column(
        String(36),
        ForeignKey("telemetry_events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    evidence_type = Column(String(100), nullable=False)
    relevance = Column(String(50), nullable=False)
    explanation = Column(Text, nullable=False)

    # Relationships
    incident = relationship("IncidentModel", back_populates="evidence")
    telemetry_event = relationship("TelemetryEventModel", back_populates="evidence")


class InvestigationModel(Base):
    __tablename__ = "investigations"

    id = Column(String(36), primary_key=True)
    incident_id = Column(
        String(36),
        ForeignKey("incidents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(String(50), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=False, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    probable_root_cause = Column(JSON, nullable=True)
    confidence = Column(Float, nullable=True)
    reasoning = Column(Text, nullable=True)
    recommendation = Column(JSON, nullable=True)
    provider_used = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    supporting_evidence = Column(JSON, nullable=True)

    # Relationships
    incident = relationship("IncidentModel", back_populates="investigations")
