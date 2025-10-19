import { Button } from "react-bootstrap";

type Props = {
  onClick?: () => void;
};

export default function LoginButton({ onClick }: Props) {
  return (
    <Button variant="primary" size="sm" onClick={onClick}>
      로그인
    </Button>
  );
}
