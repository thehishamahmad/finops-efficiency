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
  optimization: {
    title: "Continuous Optimization",
    description: "Build a regular optimization cadence to sustain infrastructure efficiency over time."
  },
  mixed: {
    title: "Environment Segmentation",
    description: "Separate production, Dev/Test, and DR policies so each workload receives the right cost strategy."
  }
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

function getStatus(score) {
  if (score >= 78) {
    return {
      label: "Strong FinOps Maturity",
      bg: "rgba(16, 185, 129, 0.16)",
      color: "#10b981",
      summary:
        "The environment demonstrates strong FinOps maturity with good governance, visibility, and operational practices. Optimization should focus on continuous improvement, advanced automation, and workload-level efficiency."
    };
  }

  if (score >= 58) {
    return {
      label: "Moderate Optimization Opportunity",
      bg: "rgba(59, 130, 246, 0.16)",
      color: "#60a5fa",
      summary:
        "The environment shows moderate maturity but still has visible optimization opportunities around cost governance, workload rightsizing, operational automation, storage efficiency, and non-production scheduling."
    };
  }

  if (score >= 38) {
    return {
      label: "High Cost Inefficiency Risk",
      bg: "rgba(245, 158, 11, 0.16)",
      color: "#f59e0b",
      summary:
        "The environment may have significant cost leakage due to limited visibility, manual operations, overprovisioned infrastructure, licensing exposure, or inconsistent optimization practices."
    };
  }

  return {
    label: "Critical Visibility & Efficiency Gap",
    bg: "rgba(239, 68, 68, 0.16)",
    color: "#ef4444",
    summary:
      "The environment indicates a critical need for infrastructure discovery, cost visibility, governance controls, and a structured FinOps improvement plan before optimization can be managed effectively."
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
  const areaWeights = {};

  selects.forEach(select => {
    if (select.value === "") {
      completed = false;
      return;
    }

    const data = parseOption(select.value);

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

  const maxScore = count * 16;
  const score = clamp(Math.round((totalScore / maxScore) * 100), 0, 100);
  const avgWaste = clamp(Math.round(totalWaste / count), 5, 60);

  const status = getStatus(score);
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

  const lowOptimization = clamp(avgWaste - 8, 5, 50);
  const highOptimization = clamp(avgWaste + 8, 10, 60);
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

  renderOptimizationAreas(areaWeights);
  renderPriorities(areaWeights, score, avgWaste);
  renderNextAction(score, avgWaste);

  document.getElementById("results").style.display = "block";

  window.scrollTo({
    top: document.getElementById("results").offsetTop - 90,
    behavior: "smooth"
  });
}

function renderOptimizationAreas(areaWeights) {
  const container = document.getElementById("optimizationAreas");
  container.innerHTML = "";

  const sortedAreas = Object.entries(areaWeights)
    .sort((a, b) => b[1] - a[1])
    .map(item => item[0]);

  const defaultAreas = [
    "visibility",
    "rightsizing",
    "scheduling",
    "storage",
    "automation",
    "observability",
    "licensing"
  ];

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

function renderPriorities(areaWeights, score, avgWaste) {
  const list = document.getElementById("priorityList");
  list.innerHTML = "";

  const sortedAreas = Object.entries(areaWeights)
    .sort((a, b) => b[1] - a[1])
    .map(item => item[0]);

  let priorities = [];

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

  if (score < 45) {
    priorities.unshift("Run a detailed infrastructure discovery workshop to establish a reliable cost baseline.");
  }

  if (avgWaste >= 35) {
    priorities.unshift("Prioritize quick-win cost leakage areas before deeper modernization work.");
  }

  priorities = [...new Set(priorities)].slice(0, 3);

  priorities.forEach(priority => {
    const li = document.createElement("li");
    li.textContent = priority;
    list.appendChild(li);
  });
}

function renderNextAction(score, avgWaste) {
  let text = "";

  if (score >= 78) {
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
