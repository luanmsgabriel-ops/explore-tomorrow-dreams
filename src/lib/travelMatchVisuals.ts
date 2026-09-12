import type { CSSProperties } from "react";

const visualUrls: Record<string, string> = {
  praia: "https://d8j0ntlcm91z4.cloudfront.net/user_3Czu2kMfVr0BPPI3ULvC1L5ZYKY/hf_20260912_132841_22b06393-03de-44fd-a227-36d31e260b35.png",
  neve: "https://d8j0ntlcm91z4.cloudfront.net/user_3Czu2kMfVr0BPPI3ULvC1L5ZYKY/hf_20260912_132841_d78c940b-1df7-4d1d-88f2-b55022b76319.png",
  parques: "https://d8j0ntlcm91z4.cloudfront.net/user_3Czu2kMfVr0BPPI3ULvC1L5ZYKY/hf_20260912_132841_2242e371-61c2-4779-8a99-00435b16e6e4.png",
  cidade: "https://d8j0ntlcm91z4.cloudfront.net/user_3Czu2kMfVr0BPPI3ULvC1L5ZYKY/hf_20260912_132841_bfa780fd-ee0f-41b4-ac94-6ef35f7d80d5.png",
  natureza: "https://d8j0ntlcm91z4.cloudfront.net/user_3Czu2kMfVr0BPPI3ULvC1L5ZYKY/hf_20260912_132841_f5969829-7740-4839-9667-9693f50b16c2.png",
  gastronomia: "https://d8j0ntlcm91z4.cloudfront.net/user_3Czu2kMfVr0BPPI3ULvC1L5ZYKY/hf_20260912_132841_13a9b07a-5b90-4f0d-b729-70cda3fde7b6.png",
  compras: "https://d8j0ntlcm91z4.cloudfront.net/user_3Czu2kMfVr0BPPI3ULvC1L5ZYKY/hf_20260912_132938_72e5f82a-1edf-401a-b8e9-12bc5e346d11.png",
  aventura: "https://d8j0ntlcm91z4.cloudfront.net/user_3Czu2kMfVr0BPPI3ULvC1L5ZYKY/hf_20260912_132938_40126998-4758-4581-877e-7981d887060c.png",
  resort: "https://d8j0ntlcm91z4.cloudfront.net/user_3Czu2kMfVr0BPPI3ULvC1L5ZYKY/hf_20260912_132938_f35cb234-a59f-4466-bcba-d9dae98b6081.png",
  all_inclusive: "https://d8j0ntlcm91z4.cloudfront.net/user_3Czu2kMfVr0BPPI3ULvC1L5ZYKY/hf_20260912_132938_fbb7d9b3-d569-44dd-91d1-3335947a5265.png",
  cruzeiro: "https://d8j0ntlcm91z4.cloudfront.net/user_3Czu2kMfVr0BPPI3ULvC1L5ZYKY/hf_20260912_132938_a8429dec-2e54-420c-a77d-02d36e2f5b14.png",
  eventos: "https://d8j0ntlcm91z4.cloudfront.net/user_3Czu2kMfVr0BPPI3ULvC1L5ZYKY/hf_20260912_132938_32b2bf43-68c6-4fd7-a0f5-ffc5527f2a42.png",
  cultura: "https://d8j0ntlcm91z4.cloudfront.net/user_3Czu2kMfVr0BPPI3ULvC1L5ZYKY/hf_20260912_133029_d42b2472-4882-4ca0-b0de-848a88574695.png",
  vida_noturna: "https://d8j0ntlcm91z4.cloudfront.net/user_3Czu2kMfVr0BPPI3ULvC1L5ZYKY/hf_20260912_133029_da5858c2-373b-44f1-884b-c66405fdc143.png",
  familia: "https://d8j0ntlcm91z4.cloudfront.net/user_3Czu2kMfVr0BPPI3ULvC1L5ZYKY/hf_20260912_133029_84b3e58c-e06c-4b5b-8432-9323a5e594f8.png",
  casal: "https://d8j0ntlcm91z4.cloudfront.net/user_3Czu2kMfVr0BPPI3ULvC1L5ZYKY/hf_20260912_133029_51cf9eb2-0fea-4acf-9741-39c430af403c.png",
  solo: "https://d8j0ntlcm91z4.cloudfront.net/user_3Czu2kMfVr0BPPI3ULvC1L5ZYKY/hf_20260912_133306_57a3dea2-40ce-44af-8ede-2fc53ff29a8e.png",
  bem_estar: "https://d8j0ntlcm91z4.cloudfront.net/user_3Czu2kMfVr0BPPI3ULvC1L5ZYKY/hf_20260912_133359_b93f2b23-0046-4a4f-8f5d-fe398b17a64a.png",
  sustentabilidade: "https://d8j0ntlcm91z4.cloudfront.net/user_3Czu2kMfVr0BPPI3ULvC1L5ZYKY/hf_20260912_133307_4d574eda-9b2a-4797-b113-73c470cedd7d.png",
  experiencias_locais: "https://d8j0ntlcm91z4.cloudfront.net/user_3Czu2kMfVr0BPPI3ULvC1L5ZYKY/hf_20260912_133306_0bd5d564-7ed8-4cec-9a80-9444dfc90509.png",
};

export type TravelMatchVisualKey = keyof typeof visualUrls;

export function travelMatchVisualUrl(key: string) {
  return visualUrls[key] ?? visualUrls.praia;
}

export function travelMatchVisualStyle(key: string): CSSProperties {
  return {
    backgroundImage: `url('${travelMatchVisualUrl(key)}')`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}
