const OPTIMIZATION_AREAS = {
  visibility: {
    title: "Cost Visibility & Governance",
    description: "Improve centralized cost reporting, ownership, tagging, budget alerting, and governance controls."
  },
  governance: {
    title: "Cost Visibility & Governance",
    description: "Introduce clearer accountability, spending guardrails, cost alerts, and policy enforcement."
  },
  rightsizing: {
    title: "Infrastructure Rightsizing",
    description: "Identify oversized, idle, or underutilized workloads to improve infrastructure efficiency."
  },
  scheduling: {
    title: "Non-Production Scheduling",
    description: "Reduce unnecessary spend by automatically stopping Dev/Test workloads outside business hours."
  },
  storage: {
    title: "Storage Lifecycle Optimization",
    description: "Review backup retention, storage tiering, lifecycle policies, and long-term data growth."
  },
  automation: {
    title: "Automation & Provisioning",
    description: "Improve provisioning speed, consistency, and operational efficiency through automation practices."
  },
  observability: {
    title: "Monitoring & Observability",
    description: "Enhance centralized monitoring, logging, alerting, and operational visibility."
  },
  licensing: {
    title: "Licensing Optimization",
    description: "Evaluate hidden TCO exposure from proprietary software licensing and modernization alternatives."
  },
  production: {
    title: "Production Efficiency",
    description: "Balance performance, availability, governance, and cost control for business-critical workloads."
  },
  productionAvailability: {
    title: "Production Availability & SLA",
    description: "Protect business-critical services through reliability controls, monitoring, capacity planning, and resilience design."
  },
  devtestLifecycle: {
    title: "Dev/Test Lifecycle Control",
    description: "Treat non-production as temporary capacity: auto-start, auto-stop, expire idle environments, and avoid permanent always-on resources."
  },
  devtestAutomation: {
    title: "Developer Velocity & CI/CD Efficiency",
    description: "Use automation to provision repeatable test environments quickly without carrying unnecessary idle infrastructure cost."
  },
  drRecovery: {
    title: "DR Recovery Alignment",
    description: "Align standby capacity, backup design, replication, and recovery testing with actual RTO and RPO expectations."
  },
  drStorage: {
    title: "DR Storage & Replication Cost Control",
    description: "Optimize DR cost through cold/warm standby patterns, lifecycle policies, backup tiering, and periodic recovery validation."
  },
  mixed: {
    title: "Environment Segmentation",
    description: "Separate production, Dev/Test, and DR policies so each workload receives the right cost strategy."
  },
  mixedChargeback: {
    title: "Cost Allocation & Ownership",
    description: "Use tagging, environment separation, and ownership reporting so shared platforms do not hide cost leakage."
  },
  optimization: {
    title: "Continuous Optimization",
    description: "Build a regular optimization cadence to sustain infrastructure efficiency over time."
  }
};

const WORKLOAD_DEFAULTS = {
  production: ["productionAvailability", "governance", "observability", "rightsizing", "storage", "automation", "licensing"],
  devtest: ["devtestLifecycle", "scheduling", "devtestAutomation", "automation", "rightsizing", "storage", "visibility"],
  dr: ["drRecovery", "drStorage", "storage", "automation", "observability", "governance", "rightsizing"],
  mixed: ["mixed", "mixedChargeback", "visibility", "governance", "scheduling", "rightsizing", "storage"],
  generic: ["visibility", "rightsizing", "scheduling", "storage", "automation", "observability", "licensing"]
};

function parseOption(value) {
  const result = {};

  value.split(",").forEach(part => {
    const [key, rawValue] = part.split(":");
    const trimmedKey = key.trim();
    const trimmedValue = rawValue.trim();

    if (trimmedKey === "score" || trimmedKey === "waste" || trimmedKey === "spend") {
      result[trimmedKey] = Number(trimmedValue);
    } else if (trimmedKey === "unknown") {
      result[trimmedKey] = trimmedValue === "true";
    } else {
      result[trimmedKey] = trimmedValue;
    }
  });

  return result;
}

function formatRM(value) {
  return "RM " + Math.round(value).toLocaleString("en-MY");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getWorkloadContext(workloadType, score) {
  const contexts = {
    production: {
      labelSuffix: "Production Workload",
      summary:
        "This is a production workload, so optimization must be balanced with availability, performance stability, monitoring, governance, and business continuity requirements. Cost reduction should not compromise service reliability."
    },
    devtest: {
      labelSuffix: "Dev/Test Workload",
      summary:
        "This is a non-production workload. The main opportunity is to avoid treating Dev/Test like Production. Optimization should focus on automated scheduling, temporary environments, shorter retention, lower-cost capacity, and developer workflow efficiency."
    },
    dr: {
      labelSuffix: "DR Workload",
      summary:
        "This is a Disaster Recovery workload. Optimization should focus on recovery alignment rather than always-on production-like capacity. The key areas are RTO/RPO validation, cold or warm standby design, backup tiering, replication cost, and periodic recovery testing."
    },
    mixed: {
      labelSuffix: "Mixed Environment",
      summary:
        "This is a mixed environment. The key priority is separating policies for Production, Dev/Test, and DR so cost governance, scheduling, retention, and availability controls are applied according to workload criticality."
    }
  };

  return contexts[workloadType] || {
    labelSuffix: "Infrastructure Environment",
    summary:
      "The environment requires workload-level segmentation to determine the most appropriate optimization strategy."
  };
}

function getStatus(score, workloadType) {
  const context = getWorkloadContext(workloadType, score);

  if (score >= 78) {
    return {
      label: `Strong FinOps Maturity - ${context.labelSuffix}`,
      bg: "rgba(16, 185, 129, 0.16)",
      color: "#10b981",
      summary:
        `${context.summary} Overall maturity appears strong, so the next focus should be continuous optimization, governance refinement, and workload-specific efficiency improvements.`
    };
  }

  if (score >= 58) {
    return {
      label: `Moderate Optimization Opportunity - ${context.labelSuffix}`,
      bg: "rgba(59, 130, 246, 0.16)",
      color: "#60a5fa",
      summary:
        `${context.summary} The assessment indicates moderate maturity with visible improvement opportunities that should be prioritized based on workload criticality.`
    };
  }

  if (score >= 38) {
    return {
      label: `High Cost Inefficiency Risk - ${context.labelSuffix}`,
      bg: "rgba(245, 158, 11, 0.16)",
      color: "#f59e0b",
      summary:
        `${context.summary} Current answers suggest cost leakage or operational inefficiency that should be addressed through a focused optimization plan.`
    };
  }

  return {
    label: `Critical Visibility & Efficiency Gap - ${context.labelSuffix}`,
    bg: "rgba(239, 68, 68, 0.16)",
    color: "#ef4444",
    summary:
      `${context.summary} The environment indicates a critical need for discovery, visibility, governance, and workload-specific optimization before major cost assumptions can be trusted.`
  };
}

function calculateFinOps() {
  const form = document.getElementById("finopsForm");
  const selects = form.querySelectorAll("select");

  let completed = true;
  let totalScore = 0;
  let totalWaste = 0;
  let count = 0;
  let monthlySpend = 0;
  let spendUnknown = false;
  let workloadType = "generic";
  const areaWeights = {};

  selects.forEach(select => {
    if (select.value === "") {
      completed = false;
      return;
    }

    const data = parseOption(select.value);

    if (select.name === "workloadType" && data.workload) {
      workloadType = data.workload;
    }

    if (typeof data.score === "number") {
      totalScore += data.score;
    }

    if (typeof data.waste === "number") {
      totalWaste += data.waste;
    }

    if (typeof data.spend === "number") {
      monthlySpend = data.spend;
    }

    if (data.unknown) {
      spendUnknown = true;
    }

    if (data.area) {
      areaWeights[data.area] = (areaWeights[data.area] || 0) + (data.waste || 0);
    }

    count++;
  });

  if (!completed) {
    alert("Please complete all fields before generating the assessment.");
    return;
  }

  // Workload-specific adjustment. Dev/Test should emphasize waste if it is treated like always-on infrastructure.
  if (workloadType === "devtest") {
    areaWeights.devtestLifecycle = (areaWeights.devtestLifecycle || 0) + 45;
    areaWeights.scheduling = (areaWeights.scheduling || 0) + 35;
    areaWeights.devtestAutomation = (areaWeights.devtestAutomation || 0) + 25;
  }

  if (workloadType === "production") {
    areaWeights.productionAvailability = (areaWeights.productionAvailability || 0) + 35;
    areaWeights.observability = (areaWeights.observability || 0) + 25;
    areaWeights.governance = (areaWeights.governance || 0) + 20;
  }

  if (workloadType === "dr") {
    areaWeights.drRecovery = (areaWeights.drRecovery || 0) + 40;
    areaWeights.drStorage = (areaWeights.drStorage || 0) + 35;
    areaWeights.storage = (areaWeights.storage || 0) + 20;
  }

  if (workloadType === "mixed") {
    areaWeights.mixed = (areaWeights.mixed || 0) + 40;
    areaWeights.mixedChargeback = (areaWeights.mixedChargeback || 0) + 30;
    areaWeights.visibility = (areaWeights.visibility || 0) + 20;
  }

  const maxScore = count * 16;
  const score = clamp(Math.round((totalScore / maxScore) * 100), 0, 100);
  let avgWaste = clamp(Math.round(totalWaste / count), 5, 60);

  if (workloadType === "devtest") {
    avgWaste = clamp(avgWaste + 8, 10, 65);
  }

  if (workloadType === "production") {
    avgWaste = clamp(avgWaste - 3, 5, 55);
  }

  const status = getStatus(score, workloadType);
  const badge = document.getElementById("statusBadge");

  badge.textContent = status.label;
  badge.style.background = status.bg;
  badge.style.color = status.color;

  document.getElementById("scoreValue").textContent = score + "%";
  document.getElementById("scoreSummary").textContent = status.summary;
  document.getElementById("executiveSummary").textContent = status.summary;

  document.getElementById("readinessPercent").textContent = score + "%";
  document.getElementById("wastePercent").textContent = avgWaste + "%";
  document.getElementById("readinessBar").style.width = score + "%";
  document.getElementById("wasteBar").style.width = avgWaste + "%";

  const lowOptimization = clamp(avgWaste - 8, 5, 55);
  const highOptimization = clamp(avgWaste + 8, 10, 70);
  document.getElementById("optimizationRange").textContent =
    lowOptimization + "% – " + highOptimization + "%";

  if (monthlySpend > 0 && !spendUnknown) {
    const annualBaseline = monthlySpend * 12;
    const lowWaste = annualBaseline * (lowOptimization / 100);
    const highWaste = annualBaseline * (highOptimization / 100);

    document.getElementById("annualBaseline").textContent = formatRM(annualBaseline) + " / year";
    document.getElementById("wasteValue").textContent =
      formatRM(lowWaste) + " – " + formatRM(highWaste) + " / year";
  } else {
    document.getElementById("annualBaseline").textContent = "Requires Assessment";
    document.getElementById("wasteValue").textContent = "Requires Assessment";
  }

  renderOptimizationAreas(areaWeights, workloadType);
  renderPriorities(areaWeights, score, avgWaste, workloadType);
  renderNextAction(score, avgWaste, workloadType);

  document.getElementById("results").style.display = "block";

  window.scrollTo({
    top: document.getElementById("results").offsetTop - 90,
    behavior: "smooth"
  });
}

function renderOptimizationAreas(areaWeights, workloadType) {
  const container = document.getElementById("optimizationAreas");
  container.innerHTML = "";

  const sortedAreas = Object.entries(areaWeights)
    .sort((a, b) => b[1] - a[1])
    .map(item => item[0]);

  const defaultAreas = WORKLOAD_DEFAULTS[workloadType] || WORKLOAD_DEFAULTS.generic;
  const finalAreas = [...new Set([...sortedAreas, ...defaultAreas])].slice(0, 7);

  finalAreas.forEach(key => {
    const area = OPTIMIZATION_AREAS[key];
    if (!area) return;

    const card = document.createElement("div");
    card.className = "optimization-card";
    card.innerHTML = `<strong>${area.title}</strong><span>${area.description}</span>`;
    container.appendChild(card);
  });
}

function renderPriorities(areaWeights, score, avgWaste, workloadType) {
  const list = document.getElementById("priorityList");
  list.innerHTML = "";

  const sortedAreas = Object.entries(areaWeights)
    .sort((a, b) => b[1] - a[1])
    .map(item => item[0]);

  let priorities = [];

  if (workloadType === "devtest") {
    priorities.push("Implement aggressive Dev/Test scheduling so environments run only during approved working or testing windows.");
    priorities.push("Introduce temporary or ephemeral test environments that expire automatically after use.");
    priorities.push("Reduce Dev/Test retention, backup, and always-on capacity because these workloads are not production-critical.");
  }

  if (workloadType === "production") {
    priorities.push("Protect production reliability while optimizing cost through rightsizing, monitoring, and controlled change governance.");
    priorities.push("Review availability, performance, and monitoring before applying aggressive cost reduction measures.");
  }

  if (workloadType === "dr") {
    priorities.push("Align DR cost with actual RTO/RPO requirements using cold, warm, or hot standby patterns.");
    priorities.push("Review backup retention, replication frequency, and storage tiering to control DR cost without weakening recovery readiness.");
  }

  if (workloadType === "mixed") {
    priorities.push("Separate Production, Dev/Test, and DR policies so each environment has the right cost, retention, and availability strategy.");
    priorities.push("Implement cost allocation, tagging, and ownership reporting across environment types.");
  }

  sortedAreas.forEach(key => {
    if (key === "visibility" || key === "governance") {
      priorities.push("Improve cost visibility, ownership, budget alerts, and governance reporting.");
    }

    if (key === "rightsizing") {
      priorities.push("Conduct infrastructure rightsizing review to identify oversized or idle workloads.");
    }

    if (key === "scheduling") {
      priorities.push("Implement non-production scheduling to reduce avoidable always-on workload costs.");
    }

    if (key === "storage") {
      priorities.push("Review backup retention, storage growth, and lifecycle optimization policies.");
    }

    if (key === "licensing") {
      priorities.push("Assess enterprise licensing dependency and identify modernization opportunities.");
    }

    if (key === "automation") {
      priorities.push("Standardize provisioning and deployment automation to reduce operational overhead.");
    }

    if (key === "observability") {
      priorities.push("Strengthen monitoring and observability to improve operational visibility.");
    }
  });

  if (score < 45 && workloadType !== "devtest") {
    priorities.unshift("Run a detailed infrastructure discovery workshop to establish a reliable cost baseline.");
  }

  if (avgWaste >= 35 && workloadType !== "production") {
    priorities.unshift("Prioritize quick-win cost leakage areas before deeper modernization work.");
  }

  priorities = [...new Set(priorities)].slice(0, 3);

  priorities.forEach(priority => {
    const li = document.createElement("li");
    li.textContent = priority;
    list.appendChild(li);
  });
}

function renderNextAction(score, avgWaste, workloadType) {
  let text = "";

  if (workloadType === "devtest") {
    text =
      "Start with a non-production cost control plan: define operating hours, enforce automatic shutdown, create temporary test environments, shorten retention where appropriate, and align infrastructure usage with developer activity windows.";
  } else if (workloadType === "production") {
    text =
      "Start with a production optimization review that validates monitoring, availability, performance baseline, rightsizing opportunities, and governance controls before applying cost reduction measures.";
  } else if (workloadType === "dr") {
    text =
      "Start with a DR cost and recovery alignment review. Validate RTO/RPO, backup tiering, replication frequency, standby model, and recovery testing cadence.";
  } else if (workloadType === "mixed") {
    text =
      "Start by segmenting workloads into Production, Dev/Test, and DR categories, then apply separate scheduling, retention, governance, and cost allocation policies for each environment.";
  } else if (score >= 78) {
    text =
      "Proceed with a focused optimization review to identify advanced automation, workload modernization, and continuous FinOps governance improvements.";
  } else if (score >= 58) {
    text =
      "Conduct a structured FinOps review covering cost visibility, workload rightsizing, storage lifecycle policy, and non-production scheduling.";
  } else if (score >= 38) {
    text =
      "Start with an infrastructure discovery workshop to establish a reliable baseline, identify high-waste areas, and prioritize immediate quick wins.";
  } else {
    text =
      "Begin with a full visibility and governance assessment before making major optimization decisions. The current environment may require deeper discovery to avoid inaccurate cost assumptions.";
  }

  document.getElementById("nextActionText").textContent = text;
}

function resetFinOps() {
  document.getElementById("finopsForm").reset();

  document.getElementById("scoreValue").textContent = "0%";
  document.getElementById("statusBadge").textContent = "Pending";
  document.getElementById("statusBadge").style.background = "";
  document.getElementById("statusBadge").style.color = "";
  document.getElementById("scoreSummary").textContent =
    "Complete the assessment to generate executive insights.";

  document.getElementById("annualBaseline").textContent = "Requires Assessment";
  document.getElementById("wasteValue").textContent = "Requires Assessment";
  document.getElementById("optimizationRange").textContent = "0% – 0%";

  document.getElementById("readinessPercent").textContent = "0%";
  document.getElementById("wastePercent").textContent = "0%";
  document.getElementById("readinessBar").style.width = "0%";
  document.getElementById("wasteBar").style.width = "0%";

  document.getElementById("executiveSummary").textContent = "";
  document.getElementById("optimizationAreas").innerHTML = "";
  document.getElementById("priorityList").innerHTML = "";
  document.getElementById("nextActionText").textContent = "";

  document.getElementById("results").style.display = "none";

  window.scrollTo({
    top: document.getElementById("assessment").offsetTop - 90,
    behavior: "smooth"
  });
}
